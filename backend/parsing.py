import requests
from bs4 import BeautifulSoup


def getInfo(link):
    responce = requests.get(link)
    soup = BeautifulSoup(responce.text, "html.parser")
    author_tag = soup.find("a", {'id': "biblio_book__author"})
    author_name = author_tag.text
    book_title_tag = soup.find('h1', {'data-widget-litres-book': '1'})
    book_title = book_title_tag.text
    return (author_name, book_title)


def check_availability(link):
    responce = requests.get(link)
    soup = BeautifulSoup(responce.text, "html.parser")
    result_tag = soup.find("div", {'class': "item_info border_bottom"})
    result = result_tag.text.strip().split()
    result = " ".join(result)
    #print(result)
    if result == "Результаты поиска В результате поиска ничего не найдено": return False
    return True


def getLinkToDownload(link):
    listLinks = []
    try:
        responce = requests.get(link).text
        if ("pdf" not in responce) or ("<a href=\"/download" not in responce):
            return []
        for index in range(len(responce)):
            if responce[index: index + 9 + 9] != "<a href=\"/download": continue
            downloadLink = ""
            indexOfSsilka = index + 10
            while (responce[indexOfSsilka] != "\"" and indexOfSsilka < len(responce)):
                downloadLink += responce[indexOfSsilka]
                indexOfSsilka += 1
            listLinks.append("https://aldebaran.ru/" + downloadLink)
            #print("ссылка на скачивание " + str(len(listLinks)))

    except:
        print("Ошибка")
    return listLinks


enter = input("Введите название книги: ")
linkSearch = "https://aldebaran.ru/pages/rmd_search/?q=" + enter
books = []

if check_availability(linkSearch):
    # поиск ссылок на книги
    linksToBook = []
    responce = requests.get(linkSearch).text
    for index in range(len(responce)):
        if responce[index : index+9+8] != "<a href=\"/author/": continue

        ssilka = ""
        indexOfSsilka = index + 9
        while (responce[indexOfSsilka] != "\""):
            ssilka += responce[indexOfSsilka]
            indexOfSsilka += 1
        ssilka = "https://aldebaran.ru" + ssilka
        if ssilka not in linksToBook:
            linksToBook.append(ssilka)

    # поиск ссылок на скачивание
    for linkIndex in range(len(linksToBook)):
        if linkIndex == 5: break
        info = getInfo(linksToBook[linkIndex])
        books.append([f"Автор: {info[0]}\nКнига: {info[1]}\nДругая информация: {linksToBook[linkIndex]}"])
        books[linkIndex].append(getLinkToDownload(linksToBook[linkIndex]))
else:
    print("Ничего не найдено")

if len(books):
    print("По вашему запросу найдены следующие книги:\n")
    for book in books:
        print(book[0])
        if (len(book[1])):
            print("Ссылки на скачивание: ")
            for link in book[1]:
                print(link[link.find("formats")+8 :] + " " + link)
        else:
            print("К сожалению ссылок на скачивание пока нет")
        print()
