Repozytorium zawierające dane wykorzystywane przez aplikację mapainternetow.pl

Dane udostępnione są na licencji zawartej w pliku [LICENSE.txt](LICENSE.txt)

---

Formaty dane generowane na podstawie głównego pliku `data.json`

### Json

Plik JSON `data.json` podzielony jest na pomniejsze pliki w poniższej strukturze:
```
*
| - maps/
| \ - {id mapy}/
|   \ - points.json <- plik z punktami dla konkretnej mapy
| - maps.json <- plik z listą dostępnych map
```
przykładowo: https://static.mapainternetow.pl/maps/1/points.json pozwala pobrać dane dla Mapy Internetów (id=1).

### Csv/excel

Plik CSV możliwy do odczytania w arkuszu kalkulacyjnym dostępny jest pod adresem
https://static.mapainternetow.pl/points.csv

Kodowanie: Unicode UTF-8

Separator: `,` (przecinek)

Ogranicznik tekstu: `"` (cudzysłów podwójny)

Separator nowej linii w tekscie: `\n` (znak nowej linii unix/macos x)

Separator nower linii w pliku: `\n` (znak nowej linii unix/macos x)

Kolumny (1:1 z pliku JSON):
- `mapId` wewnętrzny id mapy unikalny dla całego systemu
- `mapName` nazwa mapy
- `pointId` wewnętrzny id punktu unikalny dla całego systemu
- `title` tytuł punktu wyświetlanego na mapie
- `excerpt` opis/krótkie streszczenie punktu
- `assumedCoords` czy lokalizacja jest dokładna
- `tags` lista tagów oddzielona przecinkiem
- `createdAt` data dodania na mapę punktu
- `link1` `link2` ... odnośniki do materiałów wideo/artykułów etc
