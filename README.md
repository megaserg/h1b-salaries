# H-1B salaries distribution graph

Scatterplot of salaries from H-1B cases that have been submitted to Department of Labor in 2013.
One point on the plot corresponds to one H-1B case.
You can choose one or several companies, one or several job titles (synonyms are supported), and specify salary range.
You can share the resulting graph using the automatically generated URL.

## Implementation
The raw CSV data is downloaded and parsed in the browser by the client-side script.
All filtering and rendering happens on client-side too.

Website: http://serebryakov.info/h1b/

python3 xls2csv.py raw_data/LCA_FY2013.xlsx csv_data/h1b_2013.csv
python3 xls2csv.py raw_data/H-1B_FY14_Q4.xlsx csv_data/h1b_2014.csv
python3 xls2csv.py raw_data/H-1B_Disclosure_Data_FY15_Q4.xlsx csv_data/h1b_2015.csv
python3 xls2csv.py raw_data/H-1B_Disclosure_Data_FY16.xlsx csv_data/h1b_2016.csv

python3 project_fields.py 2013 csv_data/h1b_2013.csv csv_data/h1b_2013_filtered.csv
python3 project_fields.py 2014 csv_data/h1b_2014.csv csv_data/h1b_2014_filtered.csv
python3 project_fields.py 2015 csv_data/h1b_2015.csv csv_data/h1b_2015_filtered.csv
python3 project_fields.py 2016 csv_data/h1b_2016.csv csv_data/h1b_2016_filtered.csv

rm csv_data/*.compressed
rm csv_data/*.dict
python3 compressor.py --dict_path csv_data/h1b_2013-2016 csv_data/h1b_2013_filtered.csv csv_data/h1b_2014_filtered.csv csv_data/h1b_2015_filtered.csv csv_data/h1b_2016_filtered.csv

mv csv_data/*.compressed website/data/
mv csv_data/*.dict website/data/
