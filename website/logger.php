<?php

// companies = $_GET["companies"]
if (!empty($_GET["companies"])) {
    $companies = $_GET["companies"];
}
else {
    $companies = "<empty>";
}

// jobTitles = $_GET["jobTitles"]
if (!empty($_GET["jobTitles"])) {
    $jobTitles = $_GET["jobTitles"];
}
else {
    $jobTitles = "<empty>";
}

// minWage = $_GET["minWage"]
if (!empty($_GET["minWage"])) {
    $minWage = $_GET["minWage"];
}
else {
    $minWage = "<empty>";
}

// maxWage = $_GET["maxWage"]
if (!empty($_GET["maxWage"])) {
    $maxWage = $_GET["maxWage"];
}
else {
    $maxWage = "<empty>";
}

// currentTime = time()
$currentTime = date(DATE_RFC2822);

// ip = $_SERVER["ip"]
$ip = $_SERVER['REMOTE_ADDR'];

// compose line: currentTime \t ip \t companies \t jobTitles \t minWage \t maxWage \n
$line = $currentTime . "\t" . $ip . "\t" . $companies . "\t" . $jobTitles . "\t" . $minWage . "\t" . $maxWage . "\n";

// open file for append
if ($handle = fopen("queries.log", "a")) {
    // lock file
    if (flock($handle, LOCK_EX)) {
        // write line
        fwrite($handle, $line);
        
        // unlock file
        flock($handle, LOCK_UN);
    }
    else {
        echo "Error: flock() fail\n";
    }
    // close file
    fclose($handle);
}
else {
    echo "Error: fopen() fail\n";
}

?>