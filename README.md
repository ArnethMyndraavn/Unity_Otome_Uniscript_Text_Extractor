# UniScript Text Extractor

A VN text extractor for Unity games using UniScript. It requires a file that matches this naming convention: `***_text_2.bytes`.

## No Download Required, Convert the files in Browser

Tool can be accessed at [https://arnethmyndraavn.github.io/Unity_Otome_Uniscript_Text_Extractor/TextTools.html](https://arnethmyndraavn.github.io/Unity_Otome_Uniscript_Text_Extractor/TextTools.html)

## Currently supported games

- スペードの国のアリス \~Wonderful White World\~ (JP Switch)
- スペードの国のアリス \~Wonderful Black World\~ (JP Switch)
- BUSTAFELLOWS (EN Steam)
- BUSTAFELLOWS Season 2 (EN Steam demo)

## How to export

1. Acquire the `***_ep0_text_2.bytes` file for your game. For Switch titles, this typically requires extracting the RomFS.
2. In the tool, select your game from the dropdown.
3. Select your file by clicking Browse.
4. Click Export to process the file.
5. Click Download .txt or Download .csv to save the file in your preferred format.

## How to import

1. Take your translated file (only `.txt` is supported at the moment).
2. In the tool, select your chosen game from the dropdown.
3. Click Import to process the file.
4. Click Download to generate a new `.bytes` file for use in-game.
5. Rename the downloaded file to the original `***_ep0_text_2.bytes` format and replace the original game file. For Switch, you can create a layeredFS mod.

## File binary structure

| Field           |      Size | Encoding                          | Description                                                               |
| --------------- | --------: | --------------------------------- | ------------------------------------------------------------------------- |
| Magic           |   4 bytes | ASCII                             | Always `UTXT` (`55 54 58 54`)                                             |
| Version         |   4 bytes | Little-endian `uint32`            | Version; currently defaulted to `1`                                       |
| Creation time   |   4 bytes | Little-endian `uint32`            | Minutes since `2018-02-01 00:00:00`                                       |
| Table length    |   4 bytes | Little-endian `uint32`            | Byte offset immediately after `TEND`                                      |
| Number of lines | 1-4 bytes | Variable-length unsigned integer  | Number of dialogue lines                                                  |
| Line lengths    |  Variable | Variable-length unsigned integers | Encoded byte length for each line, in order                               |
| Table end       |   4 bytes | ASCII                             | Always `TEND` (`54 45 4e 44`)                                             |
| Dialogue data   |  Variable | Concatenated encoded values       | Dialogue is encoded using indexes from the game-dependent character array |
