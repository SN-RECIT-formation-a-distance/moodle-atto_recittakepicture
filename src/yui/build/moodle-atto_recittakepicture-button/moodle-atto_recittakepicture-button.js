YUI.add('moodle-atto_recittakepicture-button', function (Y, NAME) {

    // This file is part of Moodle - http://moodle.org/
    //
    // Moodle is free software: you can redistribute it and/or modify
    // it under the terms of the GNU General Public License as published by
    // the Free Software Foundation, either version 3 of the License, or
    // (at your option) any later version.
    //
    // Moodle is distributed in the hope that it will be useful,
    // but WITHOUT ANY WARRANTY; without even the implied warranty of
    // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    // GNU General Public License for more details.
    //
    // You should have received a copy of the GNU General Public License
    // along with Moodle.  If not, see <http://www.gnu.org/licenses/>.
    
    
    /**
     * @module moodle-atto_recittakepicture-button
     */
    
    /**
     * Atto text editor recittakepicture plugin.
     *
     * @namespace M.atto_recittakepicture
     * @class button
     * @extends M.editor_atto.EditorPlugin
     */
    

     IMAGETEMPLATE = '<a href="{{url}}" target="_blank">' +
     '<img src="{{url}}" alt="{{alt}}" ' +
         '{{#if width}}width="{{width}}" {{/if}}' +
         '{{#if height}}height="{{height}}" {{/if}}' +
         '{{#if presentation}}role="presentation" {{/if}}' +
         '{{#if customstyle}}style="{{customstyle}}" {{/if}}' +
         '{{#if classlist}}class="{{classlist}}" {{/if}}' +
         '{{#if id}}id="{{id}}" {{/if}}' +
         '/></a>';

    TEMPLATE = '' +
        '<form id="atto_recittakepicture_dialogue" class="recittakepicture">' +
            '<div class="camera" id="{{component}}camera"><div style="margin:auto">' +
                '<button id="{{component}}close" class="closebtn"><i class="fas fa-times-circle"></i></button>' +
                '<video id="{{component}}video" autoplay playsinline></video>' +
                '<div class="livevideo-controls"><div class="video-options"><button class="btn btn-secondary"><i class="fab fa-rev"></i></button>' +
                '<div class="container-circles" id="{{component}}startbutton"><div class="outer-circle"><div class="inner-circle"></div></div></div></div></div>' +
            '</div></div>' +
            '<canvas id="{{component}}canvas" style="display:none"></canvas>' +
            '<div class="camoutput">' +
                '<img id="{{component}}photo" width="{{width}}" height="{{height}}" alt="capture">' +
                '<div class="video-controls"><button id="{{component}}startbutton2" class="btn btn-secondary">{{get_string "takephoto" component}}</button>' +
                '<button class="btn btn-secondary" id="{{component}}submit" disabled> {{get_string "saveimage" component}}</button></div>' +
            '</div>' +
        '</form>';
        COMPONENTNAME = 'atto_recittakepicture';
         
    Y.namespace('M.atto_recittakepicture').Button = Y.Base.create('button', Y.M.editor_atto.EditorPlugin, [], {
        /**
         * A reference to the current selection at the time that the dialogue
         * was opened.
         *
         * @property _currentSelection
         * @type Range
         * @private
         */
        _currentSelection: null,
    
        /**
         * A reference to the HTMl of the dialuge content
         *
         * @property _content
         * @type String
         * @private
         */
        _content: null,
        stream: null,

        accessGranted: true,
        streamOptions: {video: { width: { min: 64, ideal: 1920 }, height: { min: 40, ideal: 1080 }}},
        devices: [],
        cur_devices: 0,
        shotBlob: '',
    
        initializer: function() {
            if (this.get('host').canShowFilepicker('media')) {
                this.addButton({
                    title: 'takephoto',
                    icon: 'e/camera',
                    iconComponent: COMPONENTNAME,
                    callback: this.openCamera,
                    buttonName: 'takephoto'
                });
                
                if(navigator.permissions){
                    navigator.permissions.query({name: "camera"}).then(function(state){ 
                        if (state == 'prompt') this.accessGranted = false; 
                    });
                }
            }
        },
    
        openCamera: function(){
            if (!this.accessGranted){
                Y.use('moodle-core-notification-alert', function() {
                    new M.core.alert({message: M.util.get_string('grantaccess', COMPONENTNAME)});
                });
                navigator.mediaDevices.getUserMedia({video:true});
                return;
            }
            
            var dialogue = this.getDialogue({
                headerContent: M.util.get_string('pluginname', COMPONENTNAME),
                focusAfterHide: true,
                width: 'auto',
                height: 'auto'
            });
            // Set a maximum width for the dialog. This will prevent the dialog width to extend beyond the screen width
            // in cases when the uploaded image has larger width.
            //dialogue.get('boundingBox').setStyle('maxWidth', '90%');
            //dialogue.get('boundingBox').setStyle('maxHeight', '90%');
            // Set the dialogue content, and then show the dialogue.
    
            var template = Y.Handlebars.compile(TEMPLATE);
            var content = Y.Node.create(template({
                    elementid: this.get('host').get('elementid'),
                    component: COMPONENTNAME,
                    width: window.innerWidth * 0.8,
                    height: window.innerHeight * 0.8,
                }));
            dialogue.set('bodyContent', content).show();

            var camera = document.getElementById(COMPONENTNAME+'camera');
            var video = document.getElementById(COMPONENTNAME+'video');
            var canvas = document.getElementById(COMPONENTNAME+'canvas');
            var photo = document.getElementById(COMPONENTNAME+'photo');
            var closebutton = document.getElementById(COMPONENTNAME+'close');
            var startbutton = document.getElementById(COMPONENTNAME+'startbutton');
            var startbutton2 = document.getElementById(COMPONENTNAME+'startbutton2');
            var submitbutton = document.getElementById(COMPONENTNAME+'submit');
            var width = window.innerWidth * 0.7;
            var height = window.innerHeight * 0.7;
            var streaming = false;
            var photodata = '';
            var that = this;

            //Generate white preview
            var context = canvas.getContext('2d');
            context.fillStyle = "#AAA";
            context.fillRect(0, 0, canvas.width, canvas.height);

            photodata = canvas.toDataURL('image/png');
            photo.setAttribute('src', photodata);

            this.startStream();
            photo.parentElement.style.display = "none";
            setTimeout(function(){dialogue.centerDialogue() }.bind(that), 500);

            video.addEventListener('canplay', function(ev) {
                if (!streaming) {
                    height = video.videoHeight / (video.videoWidth / width);

                    if (isNaN(height)) {
                        height = width / (4 / 3);
                    }
                    
                    if (video.videoHeight > window.innerHeight*0.8){
                        height = window.innerHeight * 0.8;
                        width = video.videoWidth / (video.videoHeight / height);
                    }

                    //video.setAttribute('width', width);
                    ///canvas.setAttribute('width', width);
                    //canvas.setAttribute('height', height);
                    streaming = true;
                }
            }, false);

            startbutton.addEventListener('click', function(ev) {
                ev.preventDefault();
                if (camera.style.display === "none") {
                    camera.style.display = "block";
                    photo.parentElement.style.display = "none";
                    submitbutton.disabled = true;
                    return;
                }else{
                    camera.style.display = "none";
                    photo.parentElement.style.display = "block";
                }
                if (width && height) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                    
                    if (typeof ImageCapture !== 'undefined'){
                        const mediaStreamTrack = video.srcObject.getVideoTracks()[0];
                        const imageCapture = new ImageCapture(mediaStreamTrack);
                        imageCapture.grabFrame().then(function(img){
                            that.bmpToBlob(img, function(blob){
                                that.shotBlob = blob;
                            })
                        });
                    }
            
                    photodata = canvas.toDataURL('image/png');
                    photo.setAttribute('src', photodata);
                    photo.removeAttribute('width');
                    photo.removeAttribute('height');
                    submitbutton.disabled = false;
                    setTimeout(function(){dialogue.centerDialogue() }.bind(that), 500);
                }
            }, false);
            
            startbutton2.addEventListener('click', function(ev) {
                ev.preventDefault();
                camera.style.display = "block";
                photo.parentElement.style.display = "none";
                submitbutton.disabled = true;
            });
            
            closebutton.addEventListener('click', function(ev) {
                ev.preventDefault();
                that.close();
            });

            submitbutton.addEventListener('click', function(ev) {
                ev.preventDefault();
                
                // Convert it to a blob to upload
                if (that.shotBlob){
                    that._uploadImage(that.shotBlob);
                }else{
                    var block = photodata.split(";");
                    // Get the content type of the image
                    var contentType = block[0].split(":")[1];
                    // get the real base64 content of the file
                    var realData = block[1].split(",")[1];
                    var blob = that.b64toBlob(realData, contentType);
                    that._uploadImage(blob);
                }
            }, false);
            this.loadCameraDevices();
            this.initChangeDevice();
    },

    loadCameraDevices: function(){
        if ('mediaDevices' in navigator && navigator.mediaDevices.getUserMedia) {
            var that = this;
            navigator.mediaDevices.enumerateDevices().then(function(devices){
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                if (videoDevices.length == 0){
                    document.querySelector('.video-options').style.display = 'none';
                }
                that.devices = [];
                for (var dev of videoDevices){
                    that.devices.push(dev.deviceId);
                }
            });
        }else{
            document.querySelector('.video-options').style.display = 'none';
        }
    },

    initChangeDevice: function(){
        var that = this;
        var btn = document.querySelector('.video-options>button');
        btn.addEventListener('click', function(ev){
            ev.preventDefault();
            if (that.devices.length == that.cur_devices){
                that.cur_devices = 0;
            }
            var dev = that.devices[that.cur_devices];
            that.streamOptions.video.deviceId = {exact:dev};
            that.cur_devices++;
            that.startStream();
        })
    },

    startStream: function(){
        // access video stream from webcam
        var video = document.getElementById(COMPONENTNAME+'video');
        var that = this;
        that.stopStream();
        navigator.mediaDevices.getUserMedia(that.streamOptions)
            // on success, stream it in video tag
            .then(function(stream) {
                video.srcObject = stream;
                that.stream = stream;
                video.play();
                that.loadCameraDevices();
            })
            .catch(function(err) {
                alert("An error occurred: " + err);
                //that.startStream({video: true});
            });
    },

    stopStream: function(){
        if (this.stream){
            this.stream.getTracks().forEach(function(t){ t.stop()});
        }
    },

    _uploadImage: function(fileToSave) {

        var self = this,
            host = this.get('host'),
            template = Y.Handlebars.compile(IMAGETEMPLATE);

        host.saveSelection();

        var options = host.get('filepickeroptions').image,
            savepath = (options.savepath === undefined) ? '/' : options.savepath,
            formData = new FormData(),
            timestamp = 0,
            uploadid = "",
            xhr = new XMLHttpRequest(),
            imagehtml = "",
            keys = Object.keys(options.repositories);

        formData.append('repo_upload_file', fileToSave);
        formData.append('itemid', options.itemid);

        // List of repositories is an object rather than an array.  This makes iteration more awkward.
        for (var i = 0; i < keys.length; i++) {
            if (options.repositories[keys[i]].type === 'upload') {
                formData.append('repo_id', options.repositories[keys[i]].id);
                break;
            }
        }
        formData.append('env', options.env);
        formData.append('sesskey', M.cfg.sesskey);
        formData.append('client_id', options.client_id);
        formData.append('savepath', savepath);
        formData.append('ctx_id', options.context.id);

        // Insert spinner as a placeholder.
        timestamp = new Date().getTime();
        uploadid = 'moodleimage_' + Math.round(Math.random() * 100000) + '-' + timestamp;
        host.focus();
        host.restoreSelection();
        imagehtml = template({
            url: M.util.image_url("i/loading_small", 'moodle'),
            alt: M.util.get_string('uploading', COMPONENTNAME),
            id: uploadid
        });
        host.insertContentAtFocusPoint(imagehtml);
        self.markUpdated();

        // Kick off a XMLHttpRequest.
        xhr.onreadystatechange = function() {
            var placeholder = self.editor.one('#' + uploadid),
                result,
                file,
                newhtml,
                newimage;

            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    result = JSON.parse(xhr.responseText);
                    if (result) {
                        if (result.error) {
                            if (placeholder) {
                                placeholder.remove(true);
                            }
                            throw new M.core.ajaxException(result);
                        }

                        file = result;
                        if (result.event && result.event === 'fileexists') {
                            // A file with this name is already in use here - rename to avoid conflict.
                            // Chances are, it's a different image (stored in a different folder on the user's computer).
                            // If the user wants to reuse an existing image, they can copy/paste it within the editor.
                            file = result.newfile;
                        }

                        // Replace placeholder with actual image.
                        newhtml = template({
                            url: file.url,
                            presentation: true,
                            classlist: 'w-100',
                        });
                        newimage = Y.Node.create(newhtml);
                        if (placeholder) {
                            placeholder.replace(newimage);
                        } else {
                            self.editor.appendChild(newimage);
                        }
                        self.markUpdated();
                    }
                } else {
                    Y.use('moodle-core-notification-alert', function() {
                        new M.core.alert({message: M.util.get_string('servererror', 'moodle')});
                    });
                    if (placeholder) {
                        placeholder.remove(true);
                    }
                }
            }
        };
        xhr.open("POST", M.cfg.wwwroot + '/repository/repository_ajax.php?action=upload', true);
        xhr.send(formData);
        this.close();
    },

    close: function(){
        this.getDialogue({
            focusAfterHide: null
        }).hide();
        this.stopStream();
    },
    
    bmpToBlob: function(img, f){
        
      const canvas = document.createElement('canvas');
      // resize it to the size of our ImageBitmap
      canvas.width = img.width;
      canvas.height = img.height;
      // try to get a bitmaprenderer context
      let ctx = canvas.getContext('bitmaprenderer');
      if(ctx) {
        // transfer the ImageBitmap to it
        ctx.transferFromImageBitmap(img);
      }
      else {
        // in case someone supports createImageBitmap only
        // twice in memory...
        canvas.getContext('2d').drawImage(img,0,0);
      }
      // get it back as a Blob
      var blob = canvas.toBlob(f);
      canvas.remove()
      return blob;
    },

    b64toBlob: function(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
    },

    }, {
        ATTRS: {
        }
    }, {
        ATTRS: {
            
        }
});

}, '@VERSION@', {"requires": ["moodle-editor_atto-plugin"]});
