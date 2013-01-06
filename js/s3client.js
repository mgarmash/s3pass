/**
 * s3client Amazon S3 REST client
 * Copyright (C) 2013  Max Garmash <max@garmash.org> @linx56
 */

var s3client = function(bucket, awsKey, awsSecret, s3Url){
    var anon = !(awsKey || awsSecret);
    var protocolUrl = /\./.exec(bucket) ? 'http://' : 'https://';
    s3Url = s3Url || '.s3.amazonaws.com';
    function signedHeaders(method, resource, contentType) {
        if(anon){
            return {};
        }
        var date = httpDate();
        var string_to_sign = method + '\n\n' + (contentType || '') + '\n\n' + 'x-amz-date:' + date +'\n' + '/' + bucket + '/' + resource;
        var signature =  b64_hmac_sha1(awsSecret, string_to_sign);
        var authorization = 'AWS' + ' ' + awsKey + ':' + signature;
        var headers = {'authorization': authorization, 'x-amz-date': date};
        if(contentType){
            headers['content-type'] = contentType;
        }
        return headers;
    }
    function httpDate(d) {
        d = d || new Date();
        var daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        var monthsShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        function takeYear(theDate) {
            var x = theDate.getYear();
            var y = x % 100;
            y += (y < 38) ? 2000 : 1900;
            return y;
        }

        function zeropad(num, sz) {
            return ( (sz - ("" + num).length) > 0 ) ? arguments.callee("0" + num, sz) : num;
        }

        function gmtTZ(d) {
            // Difference to Greenwich time (GMT) in hours
            var os = Math.abs(d.getTimezoneOffset());
            var h = "" + Math.floor(os / 60);
            h = (h.length === 1) ? "0" + h : h;
            var m = "" + (os % 60);
            m = (m.length === 1) ? "0" + m : m;
            return d.getTimezoneOffset() < 0 ? "+" + h + m : "-" + h + m;
        }

        return [
            daysShort[d.getDay()], ", ",
            d.getDate(), " ",
            monthsShort[d.getMonth()], " ",
            takeYear(d), " ",
            zeropad(d.getHours(), 2), ":",
            zeropad(d.getMinutes(), 2), ":",
            zeropad(d.getSeconds(), 2), " ",
            gmtTZ(d)
        ].join('');
    }
    return {
        list : function (key, success, error) {
                $.ajax({
                    url: protocolUrl + bucket + s3Url + '/' + encodeURI(key || ''),
                    headers: signedHeaders('GET', encodeURI(key || '')),
                    cache: false,
                    success: function (data) {
                        var contents = jQuery(data).find('Contents');
                        var keys = [];
                        for (var i = 0; i < contents.length; i++) {
                            keys.push(jQuery(contents[i]).find('Key').text());
                        }
                        success(keys);
                    },
                    error: error
                });
        },
        put : function (key, content, contentType, success, error) {
            $.ajax({
                url: protocolUrl + bucket + s3Url + '/' + key,
                type: 'PUT',
                data: content,
                headers: signedHeaders('PUT', key,  contentType || 'text/plain'),
                success: success,
                error: error
            });
        },

        get : function (key, success, error) {
            $.ajax({
                url: protocolUrl + bucket + s3Url + '/' + key,
                type: 'GET',
                cache: false,
                headers: signedHeaders('GET', key),
                success: success,
                error: error
            });
        },

        del : function (key, success, error) {
            $.ajax({
                url: protocolUrl + bucket + s3Url + '/' + key,
                type: 'DELETE',
                headers: signedHeaders('DELETE', key),
                success: success,
                error: error
            });
        }
    }
};