import requests
from bs4 import BeautifulSoup


def getInfo(link):
    response = requests.get(link)
    soup = BeautifulSoup(response.text, "html.parser")
    author_tag = soup.find("a", {'id': "biblio_book__author"})
    author_name = author_tag.text if author_tag else "Автор неизвестен"
    book_title_tag = soup.find('h1', {'data-widget-litres-book': '1'})
    book_title = book_title_tag.text if book_title_tag else "Название неизвестно"
    return (author_name, book_title)


def check_availability(link):
    response = requests.get(link)
    soup = BeautifulSoup(response.text, "html.parser")
    result_tag = soup.find("div", {'class': "item_info border_bottom"})
    if not result_tag:
        return False
    result = result_tag.text.strip()
    if "ничего не найдено" in result.lower():
        return False
    return True





enter = input("Введите название книги: ")
linkSearch = "https://aldebaran.ru/pages/rmd_search/?q=" + enter

if check_availability(linkSearch):
    # поиск ссылок на книги
    linksToBook = []
    response = requests.get(linkSearch).text
    for index in range(len(response)):
        if response[index: index + 9 + 8] != "<a href=\"/author/":
            continue
        ssilka = ""
        indexOfSsilka = index + 9
        while response[indexOfSsilka] != "\"":
            ssilka += response[indexOfSsilka]
            indexOfSsilka += 1
        ssilka = "https://aldebaran.ru" + ssilka
        if ssilka not in linksToBook:
            linksToBook.append(ssilka)

    # вывод только первой книги
    if linksToBook:
        first_book_link = linksToBook[0] + "read"
        info = getInfo(first_book_link)
        
        #print(f"Автор: {info[0]}")
        #print(f"Книга: {info[1]}")
        print(f"Ссылка для чтения: {first_book_link}")
    
else:
    print("Ничего не найдено")
