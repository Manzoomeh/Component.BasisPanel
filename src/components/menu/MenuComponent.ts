import { ISource, IUserDefineComponent, IDependencyContainer } from "basiscore";
import BasisPanelChildComponent from "../BasisPanelChildComponent";
import desktopLayout from "./assets/layout-desktop.html";
import mobileLayout from "./assets/layout-mobile.html";
import "./assets/style.css";
import "./assets/style-desktop.css";
import "./assets/style-mobile.css";
import {
  DefaultSource,
  IModuleInfo,
  PageId,
  PanelLevels,
} from "../../type-alias";
import MenuCacheManager from "./MenuCacheManager";
import { IMenuLoaderParam } from "./IMenuInfo";
import MenuElement from "./MenuElement";
import IPageLoaderParam from "./IPageLoaderParam";
import IPageLoader from "./IPageLoader";

export default class MenuComponent
  extends BasisPanelChildComponent
  implements IPageLoader
{
  readonly ul: HTMLUListElement;
  readonly menuContainer: HTMLDivElement;
  private readonly cache: MenuCacheManager;
  public current: MenuElement;
  public moduleMapper: Map<PanelLevels, Map<number, IModuleInfo>> = new Map<
    PanelLevels,
    Map<number, IModuleInfo>
  >();

  constructor(owner: IUserDefineComponent) {
    super(owner, desktopLayout, mobileLayout, "data-bc-bp-menu-container");
    this.menuContainer = this.container.querySelector(
      "[data-bc-bp-menu-wrapper]"
    );
    this.ul = this.menuContainer.querySelector("[data-bc-menu]");
    this.cache = new MenuCacheManager(
      this.options.rKey,
      this.options.method.menu,
      this.options.checkRkey,
      this.deviceId as number,
      this.onMenuItemClick.bind(this)
    );
    //add this to parent container to see in all other components
    this.owner.dc
      .resolve<IDependencyContainer>("parent.dc")
      .registerInstance("page_loader", this);
  }

  public initializeAsync(): Promise<void> {
    this.owner.addTrigger([
      DefaultSource.SHOW_MENU,
      DefaultSource.BUSINESS_SOURCE,
    ]);
    return Promise.resolve();
  }

  public async runAsync(source?: ISource) {
    if (source?.id == DefaultSource.SHOW_MENU) {
      this.container.setAttribute(
        `data-bc-bp-menu-seperation`,
        source.rows[0].owner
      );
      console.log("qam show menu msg", source.rows[0]);
      await this.loadDataAsync(source.rows[0]);
    }
  }

  public async loadDataAsync(menuParam: IMenuLoaderParam): Promise<void> {
    const newMenu = await this.cache.loadMenuAsync(
      menuParam.level,
      menuParam.levelId,
      menuParam.levelUrl
    );
    if (this.current != newMenu) {
      this.current = newMenu;
      this.ul.innerHTML = "";
      this.ul.append(...this.current.nodes);
      if (this.deviceId == 1) {
        window.addEventListener("scroll", () => {
          document
            .querySelectorAll("[data-bc-ul-level-open]")
            .forEach((el: HTMLElement) => {
              el.style.maxHeight = `0px`;
              el.style.opacity = `0`;
              el.removeAttribute("data-bc-ul-level-open");
              el.previousElementSibling.removeAttribute("data-bc-level-open");
            });
        });
        window.addEventListener("resize", () => {
          document
            .querySelectorAll("[data-bc-ul-level-open]")
            .forEach((el: HTMLElement) => {
              el.style.maxHeight = `0px`;
              el.style.opacity = `0`;
              el.removeAttribute("data-bc-ul-level-open");
              el.previousElementSibling.removeAttribute("data-bc-level-open");
            });
        });
        this.ul.addEventListener("scroll", () => {
          document
            .querySelectorAll("[data-bc-ul-level-open]")
            .forEach((el: HTMLElement) => {
              el.style.maxHeight = `0px`;
              el.style.opacity = `0`;
              el.removeAttribute("data-bc-ul-level-open");
              el.previousElementSibling.removeAttribute("data-bc-level-open");
            });
        });
      }
      // const tempPage = LocalStorageUtil.getCurrentPage();
      // if (tempPage) {
      //   //&& tempPage.pageId > 0) {
      //   if (LocalStorageUtil.hasMenuToActive()) {
      //     if (LocalStorageUtil.mustActiveMenuItem(menuParam.level)) {
      //       const temp = LocalStorageUtil.getCurrentMenu();
      //       const pid = temp?.info?.pid.toString();
      //       const mid = temp?.info?.mid.toString();
      //       const ownerId = temp?.ownerId.toString();
      //       // let [li, parent] = this.current.menuItemLookup.get(pid + "-" + mid);
      //       // li?.setAttribute("data-bc-menu-active", "");

      //       // if (parent) {
      //       //   parent.setAttribute("data-bc-menu-active", "");
      //       // }
      //     }
      //   }
      // }
    }
    this.tryLoadPage(
      menuParam.level,
      menuParam.levelId,
      menuParam.moduleId,
      menuParam.pageId,
      menuParam.pageArg
    );
    // const newParam: IPageLoaderParam = {
    //   level: menuParam.level,
    //   pageId: menuParam.pageId,
    //   levelId: menuParam.levelId,
    //   moduleUrl: menuParam.levelUrl,
    //   rKey: this.options.rKey,
    // };
    // this.owner.setSource(DefaultSource.DISPLAY_PAGE, newParam);
  }

  private setMenuUISelected(
    level: PanelLevels,
    levelId: number,
    moduleId: number,
    pageId: PageId
  ) {
    this.menuContainer
      .querySelectorAll(`li[data-bc-menu-active]`)
      .forEach((x) => x.removeAttribute("data-bc-menu-active"));
    // if (selectedItem) {
    //   selectedItem.removeAttribute("data-bc-menu-active");
    // }
    const menuItem = this.menuContainer.querySelector(
      `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-pid="${pageId}"][data-bc-mid="${moduleId}"]`
    );
    // console.log(
    //   "qam menu 1",
    //   menuItem,
    //   `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-pid="${pageId}"][data-bc-mid="${moduleId}"]`,
    //   this.menuContainer
    // );

    menuItem?.setAttribute("data-bc-menu-active", "");
    const relatedMenuId = menuItem
      .closest("[data-bc-related-menu-id]")
      .getAttribute("data-bc-related-menu-id");
    // console.log(
    //   "qam menu",
    //   menuItem,
    //   relatedMenuId,
    //   `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-mid="${moduleId}"][data-bc-menu-id="${relatedMenuId}"]`
    // );
    this.menuContainer
      ?.querySelector(
        `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-mid="${moduleId}"][data-bc-menu-id="${relatedMenuId}"]`
      )
      ?.setAttribute("data-bc-menu-active", "");
    // let [li, parent] = this.current.menuItemLookup.get(pageId + "-" + moduleId);
    //menuItem?.setAttribute("data-bc-menu-active", "");

    // if (parent) {
    //   parent.setAttribute("data-bc-menu-active", "");
    // }
  }

  private async onMenuItemClick(
    level: PanelLevels,
    levelId: number,
    moduleId: number,
    pageId: number,
    target: EventTarget
  ) {
    //LocalStorageUtil.setCurrentMenu(moduleId, node);
    this.tryLoadPage(level, levelId, moduleId, pageId, null);
  }
  public async tryLoadPage(
    level: PanelLevels,
    levelId: number | null,
    moduleId: number,
    pageId: PageId,
    args?: any
  ): Promise<boolean> {
    //console.log("qam mod 1", arguments);
    const moduleInfo = this.cache.getModuleInfo(level, levelId, moduleId);
    //console.log("qam mod", moduleInfo, level, levelId, moduleId, this.cache);
    if (moduleInfo) {
      const newParam: IPageLoaderParam = {
        level: level,
        pageId: pageId,
        levelId: moduleInfo.levelId,
        moduleId: moduleId,
        moduleUrl: moduleInfo.url,
        rKey: this.options.rKey,
        arguments: args,
      };
      this.owner.setSource(DefaultSource.DISPLAY_PAGE, newParam);
      this.setMenuUISelected(level, levelId, moduleId, pageId);
    }
    return moduleInfo != null;
  }

  public tryLoadPageEx(
    level: PanelLevels,
    moduleId: number,
    pageId: PageId,
    args?: any
  ): Promise<boolean> {
    //console.log("qam loadex", arguments);
    return this.tryLoadPage(level, null, moduleId, pageId, args);
  }
}
