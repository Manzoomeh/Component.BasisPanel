import HttpUtil from "../../HttpUtil";
import { QuestionUtil } from "../../QuestionUtil";
import { DefaultSource, IQuestionItem } from "../../type-alias";
import BasisPanelChildComponent from "../BasisPanelChildComponent";
import IProfileInfo from "./IProfileInfo";
import layout from "./assets/layout.html";
import "./assets/style.css";
import { IUserDefineComponent, ISource } from "basiscore";
import { IMenuLoaderParam } from "../menu/IMenuInfo";
import IPageLoaderParam from "../menu/IPageLoaderParam";

export default class ProfileComponent extends BasisPanelChildComponent {
  private profile: IProfileInfo;

  constructor(owner: IUserDefineComponent) {
    super(owner, layout, "data-bc-bp-profile-container");
  }

  public runAsync(source?: ISource): Promise<any> {
    return this.loadDataAsync();
  }

  public initializeAsync(): Promise<void> {
    this.container.addEventListener("click", (e) => {
      e.preventDefault();
      this.signalToDisplayMenu();
    });
    return Promise.resolve();
  }

  public async loadDataAsync(): Promise<void> {
    const urlFormatter = new Function(
      "rKey",
      `return \`${this.options.dataUrl.profile}\``
    );
    const questions = await HttpUtil.fetchDataAsync<Array<IQuestionItem>>(
      urlFormatter(this.options.rKey),
      "GET"
    );
    
    this.profile = QuestionUtil.toObject(questions);
    this.refreshUI();
    this.owner.setSource(DefaultSource.USER_INFO_SOURCE, this.profile);
    this.signalToDisplayMenu();
  }

  private signalToDisplayMenu() {
    if (this.profile) {
      const menuInfo: IMenuLoaderParam = {
        owner: "profile",
        ownerId: "",
        ownerUrl: this.options.baseUrl.profile,
        rKey: this.options.rKey,
        menuMethod: this.options.method.menu,
      };
      this.owner.setSource(DefaultSource.SHOW_MENU, menuInfo);
      this.signalToDisplayPage();
    }
  }

  private async signalToDisplayPage() {
    const isAuthenticate = await HttpUtil.isAuthenticate(
      this.options.rKey,
      this.options.checkRkey
    )
    const cookieName = this.options.checkRkey.cookieName;
    if (isAuthenticate == false) {
      if (cookieName && cookieName != "") {
        const cookies = document.cookie.split(";");
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].trim().split("=")[0];
          if (cookie == cookieName) {
            document.cookie =
              cookie + "=; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
            break;
          }
        }
      }
      window.location.href = this.options.checkRkey.defaultRedirectUrl;
    } else {
      const newParam: IPageLoaderParam = {
        pageId: "default",
        owner: "profile",
        ownerId: "",
        ownerUrl: this.options.baseUrl.profile,
        rKey: this.options.rKey,
        pageMethod: this.options.method.page,
      };
      this.owner.setSource(DefaultSource.DISPLAY_PAGE, newParam);
    }
  }

  private refreshUI() {
    const ui = this.container.querySelector<HTMLDivElement>(
      "[data-bc-user-name]"
    );
    ui.textContent = `${this.profile.fName} ${this.profile.lName}`;
    const fn = new Function(
      "rKey",
      "profile",
      `return \`${`${this.options.avatar}${this.options.method.userImage}`}\``
    );
      
    this.container.querySelector<HTMLImageElement>("[data-bc-user-image]").src =
      fn(this.options.rKey, this.profile);
  }
}
