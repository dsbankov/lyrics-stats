# lyrics-stats
Statistical analysis of lyrics per musical genre.

# Data
The data on which the statistical analysis is done is in the folder export_data_results. Each file in there is created by getting information from the Million Song Dataset and the Musixmatch API.

Each file's name has the following structure: stats_tracks<number_of_tracks_queried>_limit<number_of_rows_from_the_msd_dataset>_top<number_of_words_per_genre>_<timestamp>.json.

The JSON itself has the following structure:
{ "genre1" : [ "word1" : "count", ... , "wordn" : "count" ], ... , "genren" : ... }
  
# Script
export_stats.js - creates a statistical analysis of a data file and saves the it in ./export_stats_results/"timestamp"/
