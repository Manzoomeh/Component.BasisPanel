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
import LocalStorageUtil from "../../LocalStorageUtil";

export default class MenuComponent
  extends BasisPanelChildComponent
  implements IPageLoader
{
  readonly ul: HTMLUListElement;
  readonly toolboxDiv: HTMLDivElement;
  private lineHeader: HTMLElement;
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
    this.toolboxDiv = this.menuContainer.querySelector("[data-bc-bp-menu-toolbox-items]");
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
      .resolve<IDependencyContainer>("parent.dc")
      .resolve<IDependencyContainer>("parent.dc")
      .registerInstance("page_loader", this);
    this.lineHeader = document.querySelector("[data-bc-header-line]");
    this.lineHeader.style.transition = "none";
    this.lineHeader.style.width = "0";
  }

  public initializeAsync(): Promise<void> {
    this.owner.addTrigger([
      DefaultSource.SHOW_MENU,
      DefaultSource.BUSINESS_SOURCE,
    ]);
    setTimeout(() => {
      this.lineHeader.style.transition = "all 1s ease-in-out";
      this.lineHeader.style.width = "98%";
    }, 500);

    if (this.toolboxDiv) {
      const toolboxWrapper = this.toolboxDiv.closest("[data-bc-bp-menu-toolbox-wrapper]");
      toolboxWrapper.querySelector("[data-bc-bp-menu-toolbox-button]").addEventListener("click", (e) => {
        const activate = toolboxWrapper.getAttribute("data-bc-bp-menu-toolbox");
        toolboxWrapper.setAttribute("data-bc-bp-menu-toolbox", activate == "active" ? "" : "active");
      });
    }

    return Promise.resolve();
  }

  public async runAsync(source?: ISource) {
    if (source?.id == DefaultSource.SHOW_MENU) {
      const headerLine = this.container.querySelector("[data-bc-header-line]");
      headerLine.setAttribute(
        `data-bc-bp-menu-seperation`,
        source.rows[0].level
      );
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
        this.toolboxDiv.innerHTML = "";
        const toolboxWrapper = this.toolboxDiv.closest("[data-bc-bp-menu-toolbox-wrapper]");
        if (this.current.toolboxNodes.length > 0) {
          this.toolboxDiv.append(...this.current.toolboxNodes);
          toolboxWrapper.setAttribute("data-bc-have-menu-toolbox", "true");
        } else {
          toolboxWrapper.setAttribute("data-bc-have-menu-toolbox", "");
        }

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
    let moduleId = menuParam.moduleId;
    if (menuParam.moduleName) {
      moduleId = this.cache.getModuleInfoByName(
        menuParam.level,
        menuParam.levelId,
        menuParam.moduleName
      ).id;
    }
    this.tryLoadPage(
      menuParam.level,
      menuParam.levelId,
      moduleId,
      menuParam.pageId,
      menuParam.isSilent,
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
    let menuItem = this.menuContainer.querySelector(
      `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-pid="${pageId}"][data-bc-mid="${moduleId}"]`
    );
    const toolboxContainer = document.querySelector("[data-bc-bp-menu-toolbox-wrapper]");

    if (menuItem || pageId == "default") {
      this.menuContainer
        .querySelectorAll(`[data-bc-menu-active]`)
        .forEach((x) => x.removeAttribute("data-bc-menu-active"));

      // reset toolbox icon
      toolboxContainer.querySelector("[data-bc-bp-menu-toolbox-button]").innerHTML = `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 12C1.08333 12 0.729167 11.8542 0.4375 11.5625C0.145834 11.2708 3.57628e-07 10.9167 3.57628e-07 10.5C3.57628e-07 10.0833 0.145834 9.72917 0.4375 9.4375C0.729167 9.14583 1.08333 9 1.5 9C1.91667 9 2.27083 9.14583 2.5625 9.4375C2.85417 9.72917 3 10.0833 3 10.5C3 10.9167 2.85417 11.2708 2.5625 11.5625C2.27083 11.8542 1.91667 12 1.5 12ZM6 12C5.58333 12 5.22917 11.8542 4.9375 11.5625C4.64583 11.2708 4.5 10.9167 4.5 10.5C4.5 10.0833 4.64583 9.72917 4.9375 9.4375C5.22917 9.14583 5.58333 9 6 9C6.41667 9 6.77083 9.14583 7.0625 9.4375C7.35417 9.72917 7.5 10.0833 7.5 10.5C7.5 10.9167 7.35417 11.2708 7.0625 11.5625C6.77083 11.8542 6.41667 12 6 12ZM10.5 12C10.0833 12 9.72917 11.8542 9.4375 11.5625C9.14583 11.2708 9 10.9167 9 10.5C9 10.0833 9.14583 9.72917 9.4375 9.4375C9.72917 9.14583 10.0833 9 10.5 9C10.9167 9 11.2708 9.14583 11.5625 9.4375C11.8542 9.72917 12 10.0833 12 10.5C12 10.9167 11.8542 11.2708 11.5625 11.5625C11.2708 11.8542 10.9167 12 10.5 12ZM1.5 7.5C1.08333 7.5 0.729167 7.35417 0.4375 7.0625C0.145834 6.77083 3.57628e-07 6.41667 3.57628e-07 6C3.57628e-07 5.58333 0.145834 5.22917 0.4375 4.9375C0.729167 4.64583 1.08333 4.5 1.5 4.5C1.91667 4.5 2.27083 4.64583 2.5625 4.9375C2.85417 5.22917 3 5.58333 3 6C3 6.41667 2.85417 6.77083 2.5625 7.0625C2.27083 7.35417 1.91667 7.5 1.5 7.5ZM6 7.5C5.58333 7.5 5.22917 7.35417 4.9375 7.0625C4.64583 6.77083 4.5 6.41667 4.5 6C4.5 5.58333 4.64583 5.22917 4.9375 4.9375C5.22917 4.64583 5.58333 4.5 6 4.5C6.41667 4.5 6.77083 4.64583 7.0625 4.9375C7.35417 5.22917 7.5 5.58333 7.5 6C7.5 6.41667 7.35417 6.77083 7.0625 7.0625C6.77083 7.35417 6.41667 7.5 6 7.5ZM10.5 7.5C10.0833 7.5 9.72917 7.35417 9.4375 7.0625C9.14583 6.77083 9 6.41667 9 6C9 5.58333 9.14583 5.22917 9.4375 4.9375C9.72917 4.64583 10.0833 4.5 10.5 4.5C10.9167 4.5 11.2708 4.64583 11.5625 4.9375C11.8542 5.22917 12 5.58333 12 6C12 6.41667 11.8542 6.77083 11.5625 7.0625C11.2708 7.35417 10.9167 7.5 10.5 7.5ZM1.5 3C1.08333 3 0.729167 2.85417 0.4375 2.5625C0.145834 2.27083 3.57628e-07 1.91667 3.57628e-07 1.5C3.57628e-07 1.08333 0.145834 0.729166 0.4375 0.437499C0.729167 0.145832 1.08333 -1.43051e-06 1.5 -1.43051e-06C1.91667 -1.43051e-06 2.27083 0.145832 2.5625 0.437499C2.85417 0.729166 3 1.08333 3 1.5C3 1.91667 2.85417 2.27083 2.5625 2.5625C2.27083 2.85417 1.91667 3 1.5 3ZM6 3C5.58333 3 5.22917 2.85417 4.9375 2.5625C4.64583 2.27083 4.5 1.91667 4.5 1.5C4.5 1.08333 4.64583 0.729166 4.9375 0.437499C5.22917 0.145832 5.58333 -1.43051e-06 6 -1.43051e-06C6.41667 -1.43051e-06 6.77083 0.145832 7.0625 0.437499C7.35417 0.729166 7.5 1.08333 7.5 1.5C7.5 1.91667 7.35417 2.27083 7.0625 2.5625C6.77083 2.85417 6.41667 3 6 3ZM10.5 3C10.0833 3 9.72917 2.85417 9.4375 2.5625C9.14583 2.27083 9 1.91667 9 1.5C9 1.08333 9.14583 0.729166 9.4375 0.437499C9.72917 0.145832 10.0833 -1.43051e-06 10.5 -1.43051e-06C10.9167 -1.43051e-06 11.2708 0.145832 11.5625 0.437499C11.8542 0.729166 12 1.08333 12 1.5C12 1.91667 11.8542 2.27083 11.5625 2.5625C11.2708 2.85417 10.9167 3 10.5 3Z" fill="#004B85"/></svg>`;      
    }
    if (menuItem) {
      LocalStorageUtil.setMenuLastPage(pageId);
    } else if (pageId != "default") {
      pageId = LocalStorageUtil.menuPageId;
      menuItem = this.menuContainer.querySelector(
        `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-pid="${pageId}"][data-bc-mid="${moduleId}"]`
      );
    }

    if (menuItem && !menuItem.getAttribute("data-bc-bp-menu-toolbox-item")) {
      const currentIcon = menuItem.querySelector("[data-bc-bp-menu-toolbox-item-icon]")?.innerHTML;

      const toolboxContainer = document.querySelector("[data-bc-bp-menu-toolbox-wrapper]");
      const buttonContainer = toolboxContainer.querySelector("[data-bc-bp-menu-toolbox-button]");
      if (currentIcon) {
        buttonContainer.innerHTML = currentIcon;
      }
    } else {
      menuItem?.parentElement.setAttribute("data-bc-menu-active", "");
      const relatedMenuId = menuItem
        ?.closest("[data-bc-related-menu-id]")
        ?.getAttribute("data-bc-related-menu-id");
      if (relatedMenuId) {
        this.menuContainer
          ?.querySelector(
            `a[data-bc-level="${level}"][data-bc-level-id="${levelId}"][data-bc-mid="${moduleId}"][data-bc-menu-id="${relatedMenuId}"]`
          )
          ?.setAttribute("data-bc-menu-active", "");
      }
    }

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
    this.tryLoadPage(level, levelId, moduleId, pageId, false, null);
  }
  public async tryLoadPage(
    level: PanelLevels,
    levelId: number | null,
    moduleId: number,
    pageId: PageId,
    isSilent: boolean,
    args: any
  ): Promise<boolean> {
    const moduleInfo = this.cache.getModuleInfo(level, levelId, moduleId);
    if (moduleInfo) {
      const newParam: IPageLoaderParam = {
        level: level,
        pageId: pageId,
        levelId: moduleInfo.levelId,
        moduleId: moduleId,
        moduleName: moduleInfo.name,
        moduleUrl: moduleInfo.url,
        rKey: this.options.rKey,
        arguments: args,
        isSilent: isSilent ?? false,
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
    return this.tryLoadPage(level, null, moduleId, pageId, false, args);
  }

  public getModuleInfo(
    level: PanelLevels,
    levelId: number,
    moduleId: number
  ): IModuleInfo {
    return this.cache.getModuleInfo(level, levelId, moduleId);
  }
}
