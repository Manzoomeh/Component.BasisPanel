import IPageLoaderParam from "./components/menu/IPageLoaderParam";
import HttpUtil from "./HttpUtil";
import { MenuOwnerType } from "./type-alias";
import { IMenuLoaderParam, IMenuPageInfo } from "./components/menu/IMenuInfo";

export default class LocalStorageUtil {
  private static _lastBusiness: IIdValuePair;
  private static _lastCorporate: IIdValuePair;
  private static _lastPage: IPageLoaderParam;
  private static _lastMenu: ICurrentMenu;

  private static _currentBusiness: IIdValuePair;
  private static _currentCorporate: IIdValuePair;
  private static _currentPage: IPageLoaderParam;
  private static _currentUserId: number;

  public static async loadLastStateAsync(rKey: string, checkRKeyUrl: string) {
    const url = HttpUtil.formatString(checkRKeyUrl, { rKey: rKey });
    const result = await HttpUtil.fetchDataAsync<ICheckRkeyResult>(url, "GET");
    if (result.checked) {
      LocalStorageUtil._currentUserId = result.userid;
      const str = localStorage.getItem("__bc_panel_last_state__");
      if (str) {
        try {
          const obj: IStateModel = JSON.parse(str);
          if (obj.i && result.userid == obj.i) {
            if (obj.b) {
              LocalStorageUtil._lastBusiness = obj.b;
            }
            if (obj.c) {
              LocalStorageUtil._lastCorporate = obj.c;
            }
            if (obj.p) {
              LocalStorageUtil._lastPage = obj.p;
            }
            if (obj.m) {
              LocalStorageUtil._lastMenu = obj.m;
            }
          }
        } catch (ex) {
          console.error("error in  load local storage data", ex);
        }
      }
    }
  }

  public static resetCurrentUserId() {
    LocalStorageUtil._currentBusiness = null;
    LocalStorageUtil._currentCorporate = null;
    LocalStorageUtil.save();
  }

  public static setEntitySelectorCurrentValue(
    ownerType: MenuOwnerType,
    id: number,
    title: string
  ) {
    if (ownerType == "business") {
      LocalStorageUtil._currentBusiness = { id, title };
    } else if (ownerType == "corporate") {
      LocalStorageUtil._currentCorporate = { id, title };
      LocalStorageUtil._currentBusiness = null;
    }
    LocalStorageUtil.save();
  }

  private static save(): void {
    localStorage.setItem(
      "__bc_panel_last_state__",
      JSON.stringify(LocalStorageUtil.getLastState())
    );
  }

  public static getLastState(): IStateModel {
    return {
      i: LocalStorageUtil._currentUserId,
      b: LocalStorageUtil._currentBusiness,
      c: LocalStorageUtil._currentCorporate,
      p: LocalStorageUtil._currentPage,
      m: LocalStorageUtil._lastMenu,
    };
  }

  public static getEntitySelectorLastValue(ownerType: MenuOwnerType): number {
    let retVal: number = null;
    if (ownerType == "business") {
      retVal = LocalStorageUtil._lastBusiness?.id;
    } else if (ownerType == "corporate") {
      retVal = LocalStorageUtil._lastCorporate?.id;
    }
    return retVal;
  }

  public static setCurrentPage(page: IPageLoaderParam) {
    LocalStorageUtil._currentPage = page;
    LocalStorageUtil.save();
  }

  public static getCurrentPage(): IPageLoaderParam {
    return LocalStorageUtil._lastPage;
  }

  public static setCurrentMenu(menu: IMenuLoaderParam) {
    LocalStorageUtil._lastMenu = {
      menu: menu,
      ownerId: null,
      info: null,
    };
    LocalStorageUtil.save();
  }

  public static setActiveMenuItem(ownerId: string, menuItem: IMenuPageInfo) {
    LocalStorageUtil._lastMenu.ownerId = ownerId;
    LocalStorageUtil._lastMenu.info = menuItem;
    LocalStorageUtil.save();
  }
}

interface ICheckRkeyResult {
  checked: boolean;
  userid: number;
  currentOwnerid: number;
  currentDmnid: number;
  ownerid: number;
  dmnid: number;
  rkey: string;
  usercat: string;
}

export interface ICurrentMenu {
  menu: IMenuLoaderParam;
  ownerId: string;
  info: IMenuPageInfo;
}

export interface IStateModel {
  i: number;
  b: IIdValuePair;
  c: IIdValuePair;
  p: IPageLoaderParam;
  m: ICurrentMenu;
}

interface IIdValuePair {
  id: number;
  title: string;
}
