import argparse
import csv
from datetime import datetime
import logging
import sys
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

def read_csv(filename):
    with open(filename, newline='') as csv_file:
        reader = csv.reader(csv_file)
        reader.__next__() # skip header
        for row in reader:
            yield row

class Dictionary(object):
    def __init__(self):
        self.dictionary = dict()
        self.list = []
        self.next_id = 0

    def hash(self, word):
        if word not in self.dictionary:
            self.dictionary[word] = self.next_id
            self.list.append(word)
            self.next_id += 1
        return self.dictionary[word]

    def full_list(self):
        return self.list

def main(dict_path, csv_input_paths):

    d = Dictionary()

    total_count = 0;
    for csv_input_path in csv_input_paths:
        with open(csv_input_path + '.compressed', 'w', newline='') as csv_output_file:
            writer = csv.writer(csv_output_file, escapechar='^')
            writer.writerow(
                [ "Employer"
                , "JobTitle"
                , "WageFrom"
                , "WageTo"
                , "City"
                , "State"
                ])

            count = 0

            for row in read_csv(csv_input_path):
                buffer = []
                for elem in row:
                    buffer.append(d.hash(elem))
                writer.writerow(buffer)

                count += 1
                if count % 10000 == 0:
                    logging.info("Processed {} lines".format(count))

            total_count += count

    logging.info("Processed {} lines in total".format(total_count))

    logging.info("Saving dictionary")
    current_timestamp = datetime.utcnow().strftime("%Y-%m-%d_%H-%M")
    with open(dict_path + '.dict', 'w', newline='\n') as dict_output_file:
        dict_output_file.writelines("%s\n" % l for l in d.full_list())

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Compresses CSVs.')
    parser.add_argument('--dict_path', required=True, help='Path to dictionary (will be saved under <dict_path>_<timestamp>.dict)')
    parser.add_argument('csv_inputs', nargs='+', help='Path to CSV file with salaries')
    # parser.add_argument('csv_output', help='Path to projected CSV file')

    args = parser.parse_args()
    main(args.dict_path, args.csv_inputs)
