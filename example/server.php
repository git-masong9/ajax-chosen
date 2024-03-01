<?php
//sleep(2); // emulate slow network
// get the keyword



$default = isset( $_GET['default'] ) AND $_GET['default']  ? $_GET['default'] : false ;
$keyword = isset( $_GET['keyword'] ) ? $_GET['keyword'] : null ;

// get country list (in real life you will likely want to fetch from database)
$country_list = json_decode(file_get_contents('country.txt'));

if( $default ) :
    // define the data based on keyword
    $data = array();
    foreach( $keyword as $selected ) : 
        foreach($country_list as $country){
            if( $selected == '' || $country === $selected ) :
                $data[] = array('value' => $selected, 'caption' => $selected);
            endif;
        }
    endforeach;
else:
    // define the data based on keyword
    $data = array();
    foreach($country_list as $country){
        if( ($keyword == '' || stripos($country, $keyword) !== FALSE) && count($data)<20){
            $data[] = array('value' => $country, 'caption' => $country);
        }else if(count($data) >= 20){
            break;
        }
    }
endif;

echo json_encode( $data , JSON_PRETTY_PRINT );
