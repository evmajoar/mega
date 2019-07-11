var $phones = $( 'input[type="tel"]' );

if ( $phones.length ) {
    $phones.mask("+7 (999) 999-99-99");
}