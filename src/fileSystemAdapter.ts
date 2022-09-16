import * as fs from 'fs'
import { Dirent, promises as fsPromises } from 'fs'
import { util } from './util'
import { JsonObject } from './JsonObject'

export class FileSystem {

  private ongoingOperations: {path: string, promise: Promise<unknown>}[] = []

  /** in some operating systems files can get corrupted when accessed concurrently */
  // TODO: use this for all file operations
  private async scheduleOperation<T>(pathToWaitFor: string, action: () => Promise<T>): Promise<T> {
    const ongoing: {path: string, promise: Promise<unknown>} | undefined = this.ongoingOperations.find(ongoing => ongoing.path === pathToWaitFor)
    if (ongoing) {
      await ongoing.promise
      return this.scheduleOperation(pathToWaitFor, action)
    }

    const promise: Promise<T> = action()

    this.ongoingOperations.push({path: pathToWaitFor, promise})
    await promise
    this.ongoingOperations.splice(this.ongoingOperations.findIndex(finished => finished.promise === promise), 1)
    return promise
  }

  public async loadFromJsonFile<T>(filePath: string, buildFromJson: (json: string) => T): Promise<T|null> {
    return this.readFile(filePath)
      .then(json => {
        return buildFromJson(json)
      })
      .catch(_ => {
        return null
      })
  }

  public async saveToJsonFile(filePath: string, object: JsonObject): Promise<void> {
    if (await this.doesDirentExist(filePath)) {
      await this.mergeObjectIntoJsonFile(filePath, object)
        .catch(reason => util.logWarning('failed to merge object into '+filePath+': '+reason))
    } else {
      await this.writeFile(filePath, object.toJson())
        .catch(reason => util.logWarning('failed to write '+filePath+': '+reason))
    }
  }

  public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
    const direntStats: fs.Stats|null = await this.getDirentStatsIfExists(path)
    return direntStats !== null && direntStats.isFile()
  }

  public async doesDirentExist(path: string): Promise<boolean> {
    const direntStats: fs.Stats|null = await this.getDirentStatsIfExists(path)
    return direntStats !== null
  }

  public async getDirentStatsIfExists(path: string): Promise<fs.Stats|null> {
    try {
      return await this.getDirentStatsOrThrow(path) // without await, catch would not work
    } catch(_) {
      return null
    }
  }

  public async getDirentStatsOrThrow(path: string): Promise<fs.Stats|never> {
    return fsPromises.stat(path)
  }

  public async readdir(path: string): Promise<Dirent[]> {
    return fsPromises.readdir(path, {withFileTypes: true}).catch((reason) => {
      util.logWarning('Failed to readdir because: '+reason)
    }).then()
  }

  public async readFileAndConvertToHtml(path: string): Promise<string> {
    return util.escapeForHtml(await this.readFile(path))
  }

  public readFile(path: string): Promise<string> {
    return fsPromises.readFile(path, 'utf-8')
  }

  public readFileSync(path: string): string {
    return fs.readFileSync(path, 'utf-8')
  }

  public async mergeObjectIntoJsonFile(path: string, object: JsonObject): Promise<void> {
    await this.scheduleOperation(path, async (): Promise<void> => {
      const originalJson: string = await this.readFile(path)
      const mergedJson: string = object.mergeIntoJson(originalJson)
      await this.writeFile(path, mergedJson)
    })
  }

  public async writeFile(path: string, data: string): Promise<void> {
    let directory = ''
    const fileEntries: string[] = path.split('/')
    for (let i = 0; i < fileEntries.length - 1; i++) {
      directory += fileEntries[i] + '/'
    }
    await this.makeFolder(directory)
    return fsPromises.writeFile(path, data)
  }

  public async makeFolder(path: string): Promise<void> {
    await fsPromises.mkdir(path, {recursive: true})
  }

  public async symlink(existingPath: string, newPath: string, type?: 'dir'|'file'|'junction'): Promise<void> {
    await fsPromises.symlink(existingPath, newPath, type).catch((reason) => {
      util.logWarning('Failed to symlink because: '+reason)
    }).then()
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    const newFolderPath: string = util.removeLastElementFromPath(newPath)
    if (!await this.doesDirentExist(newFolderPath)) {
      await this.makeFolder(newFolderPath)
    }
    return fsPromises.rename(oldPath, newPath)
  }

}

export let fileSystem: FileSystem = new FileSystem()

export function init(object: FileSystem): void {
  fileSystem = object
}
