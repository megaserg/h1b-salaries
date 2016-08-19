from openpyxl import Workbook
from openpyxl import load_workbook

# from xlrd import open_workbook

import argparse
import csv
import logging
import sys
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

# book = xlrd.open_workbook("myfile.xls")
# print("The number of worksheets is {0}".format(book.nsheets))
# print("Worksheet name(s): {0}".format(book.sheet_names()))
# sh = book.sheet_by_index(0)
# print("{0} {1} {2}".format(sh.name, sh.nrows, sh.ncols))
# print("Cell D30 is {0}".format(sh.cell_value(rowx=29, colx=3)))
# for rx in range(sh.nrows):
#     print(sh.row(rx))

def main(xls_path, csv_path):
    logging.info("Loading " + xls_path)

    wb = load_workbook(filename=xls_path, read_only=True)

    logging.info("Loaded " + xls_path)

    ws = wb.active

    with open(csv_path, 'w', newline='') as csv_output_file:
        writer = csv.writer(csv_output_file, escapechar='^')

        count = 0
        for row in ws.rows:
            writer.writerow(map(lambda x: str(x.value), row))

            count += 1
            if count % 1000 == 0:
                logging.info("Processed {} lines".format(count))
            # for cell in row:
            #     print(cell.value)


    # book = open_workbook(filename=xls_path, verbosity=2, on_demand=True)
    #
    # print("loaded")
    # print(book.biff_version)
    # print(book.user_name)
    # print(book.sheet_names())
    #
    # ws = book.sheet_by_index(0)
    #
    # count = 0
    # for row in ws.get_rows():
    #     count += 1
    #     if count % 10000 == 0:
    #         print(count)
    #     # for cell in row:
    #     #     print(cell.value)

    logging.info("Processed {} lines in total".format(count))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Converts XLS to CSV.')
    parser.add_argument('xls', help='Path to XLS file')
    parser.add_argument('csv', help='Path to CSV file')

    args = parser.parse_args()
    main(args.xls, args.csv)
