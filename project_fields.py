import argparse
import csv
import logging
import sys
logging.basicConfig(stream=sys.stderr, level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

class DataAdapter(object):
    def visa_class(self, row):
        pass
    def case_status(self, row):
        pass
    def wage_from(self, row):
        pass
    def wage_to(self, row):
        pass
    def wage_unit(self, row):
        pass
    def employer_name(self, row):
        pass
    def job_title(self, row):
        pass
    def city(self, row):
        pass
    def state(self, row):
        pass

class Data20132014Adapter(DataAdapter):
    def visa_class(self, row):
        return row['VISA_CLASS']
    def case_status(self, row):
        return row['STATUS']
    def wage_from(self, row):
        return float(row['LCA_CASE_WAGE_RATE_FROM'])
    def wage_to(self, row):
        value = row['LCA_CASE_WAGE_RATE_TO']
        if value == 'None':
            return 0
        return float(value)
    def wage_unit(self, row):
        return row['LCA_CASE_WAGE_RATE_UNIT']
    def employer_name(self, row):
        return row['LCA_CASE_EMPLOYER_NAME']
    def job_title(self, row):
        return row['LCA_CASE_JOB_TITLE']
    def city(self, row):
        return row['LCA_CASE_WORKLOC1_CITY']
    def state(self, row):
        return row['LCA_CASE_WORKLOC1_STATE']

class Data2015Adapter(DataAdapter):
    def visa_class(self, row):
        return row['VISA_CLASS']
    def case_status(self, row):
        return row['CASE_STATUS']
    def wage_from(self, row):
        return float(row['WAGE_RATE_OF_PAY'].split('-')[0].strip())
    def wage_to(self, row):
        value = row['WAGE_RATE_OF_PAY'].split('-')[1].strip()
        if value == '' or value == 'N/A':
            return 0
        return float(value)
    def wage_unit(self, row):
        return row['WAGE_UNIT_OF_PAY']
    def employer_name(self, row):
        return row['EMPLOYER_NAME']
    def job_title(self, row):
        return row['JOB_TITLE']
    def city(self, row):
        return row['WORKSITE_CITY']
    def state(self, row):
        return row['WORKSITE_STATE']

class Data2016Adapter(DataAdapter):
    def visa_class(self, row):
        return row['VISA_CLASS']
    def case_status(self, row):
        return row['CASE_STATUS']
    def wage_from(self, row):
        return float(row['WAGE_RATE_OF_PAY_FROM'])
    def wage_to(self, row):
        return float(row['WAGE_RATE_OF_PAY_TO'])
    def wage_unit(self, row):
        return row['WAGE_UNIT_OF_PAY']
    def employer_name(self, row):
        return row['EMPLOYER_NAME']
    def job_title(self, row):
        return row['JOB_TITLE']
    def city(self, row):
        return row['WORKSITE_CITY']
    def state(self, row):
        return row['WORKSITE_STATE']

def read_csv(filename):
    with open(filename, newline='') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            yield row

def filter_certified_h1b(rows, a):
    return (row for row in rows if a.visa_class(row) == 'H-1B' and a.case_status(row) == 'CERTIFIED')

def convert_wage_to_yearly(wage, unit):
    if unit == 'Year':
        return wage
    if unit == 'Month':
        return wage * 12
    if unit == 'Bi-Weekly':
        return wage * 26
    if unit == 'Week':
        return wage * 52
    if unit == 'Hour':
        if wage > 1000:
            return None
        return wage * 52 * 40
    raise ValueError("unit is " + unit)


def main(year, csv_input_path, csv_output_path):

    if year == 2013 or year == 2014:
        a = Data20132014Adapter()
    elif year == 2015:
        a = Data2015Adapter()
    elif year == 2016:
        a = Data2016Adapter()
    else:
        raise NotImplementedError("Unknown year: " + str(year))

    with open(csv_output_path, 'w', newline='') as csv_output_file:
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
        count_no_max = 0
        count_have_max = 0
        for row in filter_certified_h1b(read_csv(csv_input_path), a):
            wage_from = convert_wage_to_yearly(a.wage_from(row), a.wage_unit(row))
            wage_to = convert_wage_to_yearly(a.wage_to(row), a.wage_unit(row))

            if wage_from is None or wage_to is None:
                continue

            # make averages work
            if wage_to == 0:
                wage_to = wage_from
                count_no_max += 1
            else:
                count_have_max += 1

            writer.writerow(
                [ a.employer_name(row)
                , a.job_title(row)
                , wage_from
                , wage_to
                , a.city(row)
                , a.state(row)
                ])
            count += 1
            if count % 10000 == 0:
                logging.info("Processed {} lines".format(count))

    logging.info("Have max: " + str(count_have_max))
    logging.info("  No max: " + str(count_no_max))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Projects only interesting fields for CSV of salaries.')
    parser.add_argument('year', type=int, help='The year the salaries data is for')
    parser.add_argument('csv_input', help='Path to CSV file with salaries')
    parser.add_argument('csv_output', help='Path to projected CSV file')

    args = parser.parse_args()
    main(args.year, args.csv_input, args.csv_output)
