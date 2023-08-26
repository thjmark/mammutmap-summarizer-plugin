import { util } from './util/util'
import { fileSystem } from './fileSystemAdapter'
import { log } from './logService'

export type NumberSetting = 'zoomSpeed'|'boxMinSizeToRender'
export type BooleanSetting = 'boxesDraggableIntoOtherBoxes'|'developerMode'|'notRethrowUnhandledErrors'|'experimentalFeatures'|'htmlApplicationMenu'|'sidebar'|'positionMapOnTopLeft'

export let settings: Settings

/**
 * uses fileSystemAdapter and has to be called after fileSystemAdapter.init(..)
 */
export async function init(): Promise<void> {
  if (!fileSystem) {
    log.warning('Settings.init() fileSystem is not defined, most likely fileSystemAdapter.init(..) was not called before.')
  }
  try {
    settings = await Settings.loadFromFileSystem()
  } catch (error: unknown) {
    log.warning(`Settings::init() failed to load application settings from fileSystem, reason: "${error}", defaulting to fallback application settings.`)
    settings = Settings.buildFallback()
  }
}

// rename to ApplicationSettings?
class Settings {

  private static readonly settingsFileName: string = 'settings.json'
  private static readonly settingsFilePath: string = './'+Settings.settingsFileName
  private static readonly alternativeSettingsFilePath: string = './resources/app/'+Settings.settingsFileName

  private zoomSpeed: number
  private boxMinSizeToRender: number
  private boxesDraggableIntoOtherBoxes: boolean
  private developerMode: boolean
  private notRethrowUnhandledErrors: boolean
  private experimentalFeatures: boolean
  private htmlApplicationMenu: boolean
  private sidebar: boolean
  private positionMapOnTopLeft: boolean // only needed for old e2e tests, TODO: update e2e tests and remove this option

  private booleanSubscribers: {setting: BooleanSetting, onSet: (newValue: boolean) => Promise<void>}[] = []

  public static async loadFromFileSystem(): Promise<Settings> {
    let settingsJson: string
    if (await fileSystem.doesDirentExistAndIsFile(Settings.settingsFilePath)) {
      settingsJson = await fileSystem.readFile(Settings.settingsFilePath)
    } else { // happens when deployed application is started for the first time
      let message = Settings.settingsFilePath+' not found'
      message += ', loading application settings from '+Settings.alternativeSettingsFilePath+'.'
      log.info(message)
      settingsJson = await fileSystem.readFile(Settings.alternativeSettingsFilePath)
    }

    return new Settings(settingsJson)
  }

  public static buildFallback(): Settings {
    return new Settings('{"zoomSpeed": 3, "boxMinSizeToRender": 200, "sidebar": true}')
  }

  private constructor(settingsJson: string) {
    const settingsParsed: any = JSON.parse(settingsJson)

    this.zoomSpeed = settingsParsed['zoomSpeed']
    this.boxMinSizeToRender = settingsParsed['boxMinSizeToRender']
    this.boxesDraggableIntoOtherBoxes = settingsParsed['boxesDraggableIntoOtherBoxes']
    this.developerMode = settingsParsed['developerMode']
    this.notRethrowUnhandledErrors = settingsParsed['notRethrowUnhandledErrors']
    this.experimentalFeatures = settingsParsed['experimentalFeatures']
    this.htmlApplicationMenu = settingsParsed['htmlApplicationMenu']
    this.sidebar = settingsParsed['sidebar']
    this.positionMapOnTopLeft = settingsParsed['positionMapOnTopLeft']
  }

  private async save(): Promise<void> {
    const thisWithoutLogic: any = {...this}
    thisWithoutLogic.booleanSubscribers = undefined

    // TODO: merge into existing settings file (not replacing whole file)
    await fileSystem.writeFile(Settings.settingsFilePath, util.toFormattedJson(thisWithoutLogic), {throwInsteadOfWarn: true})
      .then(() => {
        log.info('saved ' + Settings.settingsFilePath)
      })
      .catch(reason => log.warning(`Settings::save() failed at settingsFilePath "${Settings.settingsFilePath}", reason is ${reason}`))
  }

  public getZoomSpeed(): number {
    return this.zoomSpeed
  }

  public async setZoomSpeed(value: number): Promise<void> {
    this.zoomSpeed = value
    await this.save()
  }

  public getBoxMinSizeToRender(): number {
    return this.boxMinSizeToRender
  }

  public async setBoxMinSizeToRender(value: number) {
    this.boxMinSizeToRender = value
    await this.save()
  }

  public getNumber(setting: NumberSetting): number {
    return this[setting]
  }

  public async setNumber(setting: NumberSetting, value: number): Promise<void> {
    this[setting] = value
    await this.save()
  }

  public getBoolean(setting: BooleanSetting): boolean {
    return !!this[setting] // !! because otherwise undefined would be returned if value is not specified in settingsFile
  }

  public async setBoolean(setting: BooleanSetting, value: boolean): Promise<void> {
    this[setting] = value
    await Promise.all([
      this.save(),
      this.notifyBooleanSubscribersFor(setting)
    ])
  }

  public getRawField(name: string): unknown {
    return (this as any)[name]
  }

  public async setRawField(name: string, value: any): Promise<void> {
    (this as any)[name] = value
    await this.save()
  }

  private async notifyBooleanSubscribersFor(setting: BooleanSetting): Promise<void> {
    await Promise.all(this.booleanSubscribers
      .filter(subscriber => subscriber.setting === setting)
      .map(subscriber => subscriber.onSet(this[setting]))
    )
  }

  public async subscribeBoolean(setting: BooleanSetting, onSet: (newValue: boolean) => Promise<void>) {
    this.booleanSubscribers.push({setting, onSet})
  }

}