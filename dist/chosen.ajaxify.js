// USAGE:
// $('#some_input_id').chosen();
// chosen_ajaxify('some_input_id', 'http://some_url.com/contain/');

// REQUEST WILL BE SENT TO THIS URL: http://some_url.com/contain/some_term

// AND THE EXPECTED RESULT (WHICH IS GOING TO BE POPULATED IN CHOSEN) IS IN JSON FORMAT
// CONTAINING AN ARRAY WHICH EACH ELEMENT HAS "value" AND "caption" KEY. EX:
// [{"value":"1", "caption":"Go Frendi Gunawan"}, {"value":"2", "caption":"Kira Yamato"}]

// bindWithDelay was taken from: https://github.com/bgrins/bindWithDelay
(function($) {
    $.fn.bindWithDelay = function( type, data, fn, timeout, throttle ) {
        if ( $.isFunction( data ) ) {
            throttle = timeout;
            timeout = fn;
            fn = data;
            data = undefined;
        }
        // Allow delayed function to be removed with fn in unbind function
        fn.guid = fn.guid || ($.guid && $.guid++);
        // Bind each separately so that each element has its own delay
        return this.each(function() {
            var wait = 250;
            function cb() {
                var e = $.extend(true, { }, arguments[0]);
                var ctx = this;
                var throttler = function() {
                    wait = null;
                    fn.apply(ctx, [e]);
                };
                if (!throttle) { clearTimeout(wait); wait = null; }
                if (!wait) { wait = setTimeout(throttler, timeout); }
            }
            cb.guid = fn.guid;
            $(this).bind(type, data, cb);
        });
    };
})(jQuery);

var REQUEST = new Object();
function chosen_ajaxify(id, ajax_url, REQ_TYPE = 'GET', REQ_DATA ){
    var div_id = id;
    div_id = div_id.split("-").join("_");
    // if single
    if($(`div#${div_id}_chosen`).hasClass('chosen-container-single')){
        $(`div#${div_id}_chosen  .chosen-search input`).bindWithDelay('keyup', function(event){
            if(event.keyCode >= 37 && event.keyCode <= 40){ return null; } // ignore arrow key
            if(event.keyCode == 13){ return null; } // ignore enter
            if(REQUEST[id] != null){ REQUEST[id].abort(); } // abort previous ajax
            // get keyword and build regex pattern (use to emphasis search result)
            var keyword = $(`div#${div_id}_chosen .chosen-search input`).val();
            var keyword_pattern = new RegExp(keyword, 'gi');
            // remove all options of chosen
            $(`div#${div_id}_chosen ul.chosen-results`).empty();
            // remove all options of original select
            $(`#${id}`).empty();
            REQUEST[id] = $.ajax({
                url: ajax_url,
                dataType: "json",
                type: REQ_TYPE,
                data: {'keyword':keyword},
                success: function(response){
                    // map, just as in functional programming :). Other way to say "foreach"
                    // add new options to original select
                    $(`#${id}`).append(`<option value=""></option>`);
                    $.map(response, function(item){
                        $(`#${id}`).append(`<option value="${item.value}">${item.caption}</option>`);
                    });
                },
                complete: function(){
                    keyword = $('div#' + div_id + '_chosen' + ' .chosen-search input').val();
                    // update chosen
                    $(`#${id}`).trigger("chosen:updated");
                    // some trivial UI adjustment
                    $(`div#${div_id}_chosen`).removeClass('chosen-container-single-nosearch');

                    $(`div#${div_id}_chosen .chosen-search input`).val(keyword);
                    $(`div#${div_id}_chosen .chosen-search input`).removeAttr('readonly');
                    $(`div#${div_id}_chosen .chosen-search input`).focus();
                    // emphasis keywords
                    $(`div#${div_id}_chosen .active-result`).each(function(){
                        var html = $(this).html();
                        $(this).html(html.replace(keyword_pattern, function(matched){
                            return `<em>${matched}</em>`;
                        }));
                    });
                }
            }, 500);
        });
    }
     // if multi
    else if($('div#' + div_id + '_chosen').hasClass('chosen-container-multi')){
        $('div#' + div_id + '_chosen' + ' input').bindWithDelay('keyup', function(event){
            if(event.keyCode >= 37 && event.keyCode <= 40){ return null; } // ignore arrow key
            if(event.keyCode == 13){ return null; } // ignore enter
            if(REQUEST[id] != null){ REQUEST[id].abort(); }
            var old_input_width = $('div#' + div_id + '_chosen' + ' input').css('width');
            // get keyword and build regex pattern (use to emphasis search result)
            var keyword = $(this).val();
            var keyword_pattern = new RegExp(keyword, 'gi');
            // old values and captions
            var old_values = new Array();
            var old_captions = new Array();
            $(`#${id} option:selected`).each(function(){
                old_value = $(this).val();
                old_caption = $(this).html();
                old_values.push(old_value);
                old_captions.push(old_caption);
            });
            // remove all options of chosen
            $(`div#${div_id}_chosen ul.chosen-results`).empty();
            $(`#${id}`).empty();
            console.log( old_values.length ) ;
            REQUEST[id] = $.ajax({
                url: ajax_url,
                dataType: "json",
                type: REQ_TYPE,
                data: {'keyword':keyword},
                success: function(response){
                    // add the old selected options
                    for(i=0; i<old_values.length; i++){
                        value = old_values[i];
                        caption = old_captions[i];
                        $(`#${id}`).append(`'<option selected value="${value}">${caption}</option>'`)
                    }
                    // map, just as in functional programming :). Other way to say "foreach"
                    $.map(response, function(item){
                        // this is ineffective, is there any "in" syntax in javascript?
                        if( !old_values.includes( item.value ) ){
                            $(`#${id}`).append(`<option value="${item.value}">${item.caption}</option>`);
                        }
                    });
                },
                complete: function(response){
                    keyword = $(`div#${div_id}_chosen input`).val();
                    $(`#${id}`).trigger("chosen:updated");
                    $(`div#${div_id}_chosen`).removeClass('chosen-container-single-nosearch');
                    $(`div#${div_id}_chosen input`).val(keyword);
                    $(`div#${div_id}_chosen input`).removeAttr('readonly');
                    $(`div#${div_id}_chosen input`).css('width', old_input_width);
                    $(`div#${div_id}_chosen input`).focus();
                    // put that underscores
                    $(`div#${div_id}_chosen .active-result`).each(function(){
                        var html = $(this).html();
                        $(this).html(html.replace(keyword_pattern, function(matched){
                            return `<em>${matched}</em>`;
                        }));
                    });
                }
            });
        }, 500);
    }
}

function chosen_depend_on( id , id_depend_on , ajax_url , REQ_TYPE = 'GET' ){
    var OLD_VALUE = $(`${id_depend_on}`).val();
    $(`${id_depend_on}`).change(function(event){
        var val = $(this).val();
        if(val != OLD_VALUE){
            $.ajax({
                'url' : ajax_url,
                'dataType' : 'json',
                'type': REQ_TYPE,
                'data': {'keyword':val},
                'success' : function(response){
                    $(`#${id}`).empty();
                    $.map(response, function(item){
                        $(`#${id}`).append(`<option value="${item.value}">${item.caption}</option>`);
                    });
                    $(`#${id}`).trigger("chosen:updated");
                    $(`#${id}`).trigger("change");
                }
            });
        }
    })
}

// Shortcut functions here
function ajaxChosenDepend( id, id_depend_on, ajax_url, opt = '' , type = 'GET' ){
    if( opt == '' ){ var opts = {allow_single_deselect:true, width:"200px", search_contains: true} }else{ var opts = opt }
    $('#city_select').chosen( opts );
    chosen_depend_on( id = id , id_depend_on = id_depend_on , ajax_url = ajax_url , REQ_TYPE = type )
}
function ajaxChosen( id, url, opt = {} , val = [] , type = 'GET' ){
    if( opt == '' ){ var opts = {allow_single_deselect:true, width:"200px", search_contains: true} }else{ var opts = opt }
    $( `#${id}` ).chosen( opts );
    chosen_ajaxify( id, url, type );
    if( val.length > 0 ){
        $(`div#${id}_chosen ul.chosen-results`).empty();
        $(`#${id}`).empty();
        $.ajax({
            'url' : url,
            'dataType' : 'json',
            'type': type,
            'data': {keyword:val,default:true},
            'success' : function(response){
                $(`#${id}`).empty();
                $.map(response, function(item){
                    $(`#${id}`).append(`<option selected value="${item.value}">${item.caption}</option>`);
                });
                $(`#${id}`).trigger("chosen:updated");
                $(`#${id}`).trigger("change");
            }
        });
    }
}