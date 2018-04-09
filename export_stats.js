const fs = require('fs');
const os = require('os');
const path = require('path');
const mkdirp = require('mkdirp');

// **********************************************************************
// *************************  INPUT & CONFIG  ***************************
// **********************************************************************

const input_file = './export_data_results/stats_tracks125045_limit10000000_top100_1522502786110.json';
const words_count = 20;
const genres_count = 10;
const excluded_genres = ["Pop in Spanish", "Latin", "French Pop", "Alternative & Rock in Spanish", "World", "Vocal",
"Christian & Gospel", "Salsa y Tropical", "Holiday", "Regional Mexicano", "Adult Alternative", "MPB", "CCM", "Brazilian", "Comedy", "German Folk",
"Latin Rap"];
var common_words = ["que", "de", "ca", "y", "el", "tu", "un", "en", "te", "se", "e", "es", "yo", "si", "por", "lo", "is", "are", "was", "am", "been"];
require('common-words').forEach(function(common_word) {
	common_words.push(common_word.word.toLowerCase());
});

// **********************************************************************
// **********************************************************************
// **********************************************************************

var genre_words_file_contents = fs.readFileSync(input_file, { encoding: 'utf8' });
var genre_words = JSON.parse(genre_words_file_contents);
var genres = get_genres(genre_words, genres_count);

merge_all_genres(genre_words);

let timestamp = Date.now();

// create "general" .csv files
let csv_data_general_without_common_words = create_csv_data_general(true);
create_general_csv_file(csv_data_general_without_common_words, timestamp, true);

let csv_data_general_with_common_words = create_csv_data_general(false);
create_general_csv_file(csv_data_general_with_common_words, timestamp, false);

// create "per genre" .csv files
let csv_data_per_genre_without_common_words = create_csv_data_per_genre(true);
create_csv_file_per_genre(csv_data_per_genre_without_common_words, timestamp, true);

let csv_data_per_genre_with_common_words = create_csv_data_per_genre(false);
create_csv_file_per_genre(csv_data_per_genre_with_common_words, timestamp, false);

let words = ["love", "hate", "feel", "want", "babi", "girl", "boy", "sex", "dance", "run", "death", "cake", "sushi", "smoke", "nigga"];
words.forEach(function(word) {
	let csv_data_for_word = create_csv_data_for_word(word);
	create_word_csv_file(csv_data_for_word, timestamp, word);
});


// **********************************************************************
// *************************  HELPER FUNCTIONS  *************************
// **********************************************************************

function create_csv_data_general(exclude_common_words) {
	let csv_data_general = "";

	// write first line (column names) - all the genres
	genres.forEach(function (genre) {
		csv_data_general += "," + genre;
	});
	csv_data_general += os.EOL;

	// write every row -> <word>,<cnt_for_genre1>,<cnt_for_genre2>...
	let percentage_per_genre = {};
	let most_popular_words = get_words(genre_words, genres, words_count, exclude_common_words);
	for (let word_data of most_popular_words) {
		let word = word_data[0];
		csv_data_general += word;
		for (let genre of genres) {
			let all_words_count = get_all_words_count(genre_words[genre]);
			let word_count = get_word_count(genre_words[genre], word);
			// let value = exclude_common_words ? word_count : (word_count / all_words_count) * 100;
			// let value = exclude_common_words ? (word_count / all_words_count) * 10000 : (word_count / all_words_count) * 100;
			let value = (word_count / all_words_count) * 100;
			percentage_per_genre[genre] = !percentage_per_genre[genre] ? value : (percentage_per_genre[genre] + value);
			csv_data_general += "," + value;
		}
		csv_data_general += os.EOL;
	}
	lg(csv_data_general);
	return csv_data_general;
}

function create_csv_data_per_genre(exclude_common_words) {
	let csv_data_per_genre = {};
	for (let genre of genres) {
		csv_data_per_genre[genre] = "," + genre + os.EOL;
		genre_words[genre].sort(function(a, b) {
			return b.count - a.count;
		});
		let i = 0;
		for (let word_data of genre_words[genre]) {
			if (i >= words_count) break;
			if (exclude_common_words && common_words.includes(word_data.word)) continue;
			csv_data_per_genre[genre] += word_data.word + "," + word_data.count + os.EOL;
			i++;
		}	
	}
	lg(csv_data_per_genre);
	return csv_data_per_genre;
}

function create_csv_data_for_word(word) {
	let word_percentage_per_genre = [];
	genres.forEach(function (genre) { // TODO sort genres
		let all_words_count = get_all_words_count(genre_words[genre]);
		let word_count = get_word_count(genre_words[genre], word);
		let percentage = ((word_count / all_words_count) * 100);
		lg(all_words_count + " " + word_count);
		word_percentage_per_genre.push({ 'genre' : genre, 'percentage' : percentage });
	});
	word_percentage_per_genre.sort(function(a, b) {
		return b.percentage - a.percentage;
	});
	let csv_data_for_word = "," + word + os.EOL;
	for (let word_percentage of word_percentage_per_genre) {
		csv_data_for_word += word_percentage.genre + "," + word_percentage.percentage + os.EOL;
	}
	return csv_data_for_word;
}

function create_csv_file_per_genre(csv_data_per_genre, timestamp, exclude_common_words) {
	for (let genre in csv_data_per_genre) {
		create_genre_csv_file(csv_data_per_genre[genre], timestamp, exclude_common_words, genre);
	}
}

function create_general_csv_file(csv_data, timestamp, exclude_common_words) {
	let dir = __create_base_dir(timestamp);
	let genres_tag = genres_count + "genres";
	let words_cnt_tag = words_count + "words";
	let words_tag = exclude_common_words ? "without_common_words" : "with_common_words";
	let output_file = dir + "/" + __get_input_file_base_name() + "_" + genres_tag + "_" + words_cnt_tag + "_" + words_tag + ".csv";
	__create_file(output_file, csv_data);
}

function create_genre_csv_file(csv_data, timestamp, exclude_common_words, genre) {
	let dir = __create_base_dir(timestamp);
	let words_tag = exclude_common_words ? "without_common_words" : "with_common_words";
	let output_file = dir + "/" + __get_input_file_base_name() + "_" + genre.toLowerCase().replace(/\W/gi, '_') + "_" + words_tag + ".csv";
	__create_file(output_file, csv_data);
}

function create_word_csv_file(csv_data, timestamp, word) {
	let dir = __create_base_dir(timestamp);
	let genres_tag = genres_count + "genres";
	let output_file = dir + "/" + __get_input_file_base_name() + "_" + genres_tag + "_" + word + ".csv";
	__create_file(output_file, csv_data);
}

function __get_input_file_base_name() {
	return path.basename(input_file, path.extname(input_file));
}

function __create_base_dir(timestamp) {
	let dir = "./export_stats_results/" + timestamp;
	mkdirp(dir, function (err) { (err) ? lg(err) : ""; });
	return dir;
}

function __create_file(output_file, csv_data) {
	fs.writeFile(output_file, csv_data, function(err) {
		if (err) {
			return console.log(err);
		}
		lg("Data saved to file " + output_file);
	});
}

function merge_genres(genre_words, genre, genre_to_be_merged) {
	for (let word_data_to_be_merged of genre_words[genre_to_be_merged]) {
		add_word_data(genre_words, genre, word_data_to_be_merged);
	}
	delete genre_words[genre_to_be_merged];
}

function add_word_data(genre_words, genre, word_data) {
	let current_word_count = undefined;
	let i = 0;
	for (let c_word_data of genre_words[genre]) {
		if (c_word_data.word === word_data.word) {
			current_word_count = c_word_data.count;
			break;
		}
		i++;
	}
	if (current_word_count === undefined) {
		genre_words[genre].push({"word" : word_data.word, "count" : word_data.count});
	} else {
		genre_words[genre].push({"word" : word_data.word, "count" : current_word_count + word_data.count});
		genre_words[genre].splice(i, 1);
	}
}

function get_genres(genre_words, genres_count) {
	let genres_to_words_count = new Map();
	for (let genre in genre_words) {
		if (excluded_genres.includes(genre)) continue;
		let count = 0;
		for (word_data of genre_words[genre]) {
			count += word_data.count; 
		}
		genres_to_words_count.set(genre, count);
	}
	genres_to_words_count = new Map([...genres_to_words_count.entries()].sort(function (a, b) {
		return b[1] - a[1];
	}));
	return get_top_only(genres_to_words_count.keys(), genres_count);
}

function get_all_words_count(word_data_arr) {
	let count = 0;
	for (let word_data of word_data_arr) {
		count += word_data.count;
	}
	return count;
}

function get_word_count(word_data_arr, word) {
	for (let word_data of word_data_arr) {
		if (word_data.word === word) {
			return word_data.count;
		}
	}
	return 0;
}

function get_words(genre_words, genres, words_count, exclude_common_words) {
	let all_words = new Map();
	for (let genre in genre_words) {
		if (!genres.includes(genre)) continue;
		for (let word_data of genre_words[genre]) {
			if (exclude_common_words && common_words.includes(word_data.word)) continue;
			let global_count = all_words.get(word_data.word);
			if (!global_count) {
				all_words.set(word_data.word, parseInt(word_data.count));
			} else {
				all_words.set(word_data.word, global_count + parseInt(word_data.count));
			}
		}
	}
	all_words = new Map([...all_words.entries()].sort(function (a, b) {
		return b[1] - a[1];
	}));
	let all_words_sorted = get_top_only(all_words, words_count);
	return all_words_sorted; 
}

function get_top_only(collection, top_count) {
	let collection_filtered = [];
	let counter = 0;
	for (let data of collection) {
		if (!top_count || counter < top_count) {
			collection_filtered.push(data);
		}
		counter++;
	}
	return collection_filtered;
}

function merge_all_genres(genre_words) {
	merge_genres(genre_words, "Rock", "Indie Rock");
	merge_genres(genre_words, "Rock", "Hard Rock");
	merge_genres(genre_words, "Rock", "Prog-Rock/Art Rock");
	merge_genres(genre_words, "Rock", "Folk-Rock");
	merge_genres(genre_words, "Rock", "Soft Rock");
	merge_genres(genre_words, "Rock", "Goth Rock");
	merge_genres(genre_words, "Rock", "College Rock");
	merge_genres(genre_words, "Rock", "Rock & Roll");
	merge_genres(genre_words, "Rock", "Arena Rock");
	merge_genres(genre_words, "Rock", "American Trad Rock");
	merge_genres(genre_words, "Rock", "Blues-Rock");
	merge_genres(genre_words, "Rock", "Glam Rock");
	merge_genres(genre_words, "Rock", "Roots Rock");
	merge_genres(genre_words, "Rock", "Christian Rock");
	merge_genres(genre_words, "Rock", "Southern Rock");
	merge_genres(genre_words, "Pop", "Vocal Pop");
	merge_genres(genre_words, "Pop", "Britpop");
	merge_genres(genre_words, "Pop", "Pop Punk");
	merge_genres(genre_words, "Pop", "Christian Pop");
	merge_genres(genre_words, "Pop", "Indie Pop");
	merge_genres(genre_words, "Pop", "Traditional Pop");
	merge_genres(genre_words, "Pop", "Cantopop");
	merge_genres(genre_words, "Electronic", "Electronica");
	merge_genres(genre_words, "Electronic", "House");
	merge_genres(genre_words, "Electronic", "Dance");
	merge_genres(genre_words, "Electronic", "Techno");
	merge_genres(genre_words, "Electronic", "Disco");
	merge_genres(genre_words, "Electronic", "Downtempo");
	merge_genres(genre_words, "Electronic", "Trance");
	merge_genres(genre_words, "Electronic", "Breakbeat");
	merge_genres(genre_words, "Electronic", "IDM/Experimental");
	merge_genres(genre_words, "Jazz", "Vocal Jazz");
	merge_genres(genre_words, "Jazz", "Smooth Jazz");
	merge_genres(genre_words, "Jazz", "Crossover Jazz");
	merge_genres(genre_words, "Jazz", "Mainstream Jazz");
	merge_genres(genre_words, "Folk", "Alternative Folk");
	merge_genres(genre_words, "Folk", "Traditional Folk");
	merge_genres(genre_words, "Folk", "Contemporary Folk");
	merge_genres(genre_words, "Folk", "Celtic Folk");
	merge_genres(genre_words, "Blues", "Electric Blues");
	merge_genres(genre_words, "Blues", "Chicago Blues");
	merge_genres(genre_words, "Heavy Metal", "Death Metal/Black Metal");
	merge_genres(genre_words, "Heavy Metal", "Christian Metal");
	merge_genres(genre_words, "Heavy Metal", "Hair Metal");
	merge_genres(genre_words, "Hip Hop/Rap", "Hip-Hop");
	merge_genres(genre_words, "Hip Hop/Rap", "Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "Gangsta Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "West Coast Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "Underground Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "Hardcore Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "Alternative Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "Christian Rap");
	merge_genres(genre_words, "Hip Hop/Rap", "East Coast Rap");
}

function lg(msg) {
	console.log(msg);
}