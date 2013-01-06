/**
 * s3pass password manager
 * Copyright (C) 2013  Max Garmash <max@garmash.org> @linx56
 */
jQuery(function ($) {
    $.ajaxSetup({timeout: 2000});

    var notifyTimeout;
    function notify(msg, type){
        var $notify = $('#notify');
        switch(type){
            case 'OK':
                $notify.removeClass('error');
                $notify.html(msg);
                break;
            case 'ERROR':
                $notify.addClass('error');
                $notify.html(msg);
                break;
        }
        clearTimeout(notifyTimeout);
        notifyTimeout = setTimeout(function(){$notify.fadeOut(200, function(){$notify.html(''); $notify.show();});}, 3000);
    }
    function notifyOk(msg){
        notify(msg,'OK')
    }
    function notifyError(msg){
        notify(msg, 'ERROR')
    }

    var s3;
    var masterpass = '';
    var storage = null;
    var idleTime = 0;
    var autocompleter = null;

    var $login = $('#login');
    var $settings = $('#settings');
    var $password = $('#password');
    var $password2 = $('#password2');
    var $bucket = $('#bucket');
    var $s3key = $('#s3key');
    var $s3secret = $('#s3secret');

    $settings.find('.save').click(function(){
        if($password.val() != $password2.val()){
            notifyError('Passwords do not match')
        } else {
            if ($password.val() === '' || $bucket.val() === '' || $s3key.val() === '' || $s3secret.val() === ''){
                notifyError('All fields are mandatory')
            } else {
                var setBucket = bucket != $bucket.val();
                bucket = $bucket.val();
                storage = storage || {items:{},s3:{key:'', secret:''}};
                storage.s3.key = $s3key.val();
                storage.s3.secret = $s3secret.val();
                masterpass = $password.val();
                s3 = s3client(bucket, storage.s3.key, storage.s3.secret);
                if(setBucket) {
                    s3.get('index.html',function(content){
                        content = content.replace(/var bucket = '\s*';/, "var bucket = '" + bucket + "';");
                        s3.put('index.html', content, 'text/html', function(){
                            encryptAndSaveStorage(function(){
                                window.location.reload()
                            });
                        },function(error){
                            notifyError('Error while saving. Details in console');
                            console.log(error);
                        })
                    }, function(error){
                        notifyError('Error while saving. Details in console');
                        console.log(error);
                    })
                } else {
                    encryptAndSaveStorage(function(){
                        window.location.reload()
                    });
                }
            }
        }
    });


    if(!bucket){
        $settings.show();
        $password.focus();
    } else {
        $login.show();

        s3 = s3client(bucket);

        var $masterpass = $('#masterpass');
        $masterpass.keypress(function (e) {
            if (e.which == 13) {
                masterpass = $masterpass.val();
                $masterpass.prop('disabled', true);
                getStorageAndDecrypt();
            }
        });
        $masterpass.focus();

        var $navigation = $('#navigation');
        $('#nav-storage').click(function () {
            $settings.hide();
            $storage.show();
            $key.focus();
        });
        $('#nav-settings').click(function () {
            $password.focus();
            $storage.hide();
            $settings.show();
        });

        var $storage = $('#storage');
        var $key = $('#key');
        var $username = $('#username');
        var $secret = $('#secret');
        $storage.find(".save").click(function () {
            if ($key.val() && $secret.val()) {
                if (!storage.items[$key.val()]) {
                    storage.items[$key.val()] = {};
                }
                storage.items[$key.val()].username = $username.val();
                storage.items[$key.val()].secret = $secret.val();
                autocompleter.cacheFlush();
                encryptAndSaveStorage();
            }
        });
        $storage.find('.delete').click(function () {
            if ($key.val()) {
                delete storage.items[$key.val()];
                $key.val('');
                $username.val('');
                $secret.val('');
                autocompleter.cacheFlush();
                encryptAndSaveStorage();
            }
        });

        function loginFailed() {
            console.log('decryption failed');
            $masterpass.val('');
            $masterpass.animate({"margin-left": "-=50px"}, 100);
            $masterpass.animate({"margin-left": "+=100px"}, 100);
            $masterpass.animate({"margin-left": "-=50px"}, 100);
            $masterpass.prop('disabled', false);
            $masterpass.focus();
        }

        function loginSucceed() {
            $login.fadeOut(200, function(){
                $storage.show();
                $navigation.show();
                $key.focus();
                $key.autocomplete({
                    data: [],
                    processData: function () {
                        return Object.keys(storage.items)
                    },
                    delay: 100,
                    autoFill: true,
                    minChars: 1,
                    selectFirst: true,
                    onNoMatch: function () {
                        $username.val('');
                        $secret.val('');
                    },
                    onItemSelect: function (data) {
                        var item = storage.items[data.value];
                        $username.val(item.username);
                        $secret.val(item.secret);
                    }
                });
                autocompleter = $key.data('autocompleter');
                watchIdle();
            });
        }

        function getStorageAndDecrypt() {
            s3.get('storage', function(content){
                try {
                    storage = $.parseJSON(CryptoJS.AES.decrypt(content, masterpass).toString(CryptoJS.enc.Utf8));
                }catch (e) {}
                if (storage && storage.items && storage.s3) {
                    if (storage.s3.key && storage.s3.secret) {
                        s3 = s3client(bucket, storage.s3.key, storage.s3.secret);
                        $s3key.val(storage.s3.key);
                        $s3secret.val(storage.s3.secret);
                        $password.val(masterpass);
                        $password2.val(masterpass);
                        $bucket.val(bucket);
                    }
                    loginSucceed();
                }
                else {
                    loginFailed();
                }

            }, function(error) {
                loginFailed();
            });
        }

        function encryptAndSaveStorage(success) {
            var encrypted = CryptoJS.AES.encrypt(JSON.stringify(storage), masterpass).toString();
            s3.put('storage', encrypted, 'text/plain', function () {
                notifyOk('Successfully saved');
                if(success) {
                    success();
                }
            }, function (error) {
                notifyError('Error while saving. Details in console');
                console.log(error);
            });
        }

        function watchIdle() {
            var idleInterval = setInterval(function () {
                if (++idleTime > 5) {
                    window.location.reload();
                }
            }, 60000);
            $(document).mousemove(function (e) {
                idleTime = 0;
            });
            $(document).keypress(function (e) {
                idleTime = 0;
            });
        }
    }
});