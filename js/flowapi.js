FlowApi = function() {
    this.validMethods = ['verify', 'authSuccessful', 'getLessonStatus', 'getLessonLocation', 'getTotalTime', 'set_lesson_location', 'set_progress', 'set_session_time', 'started', 'finished', 'quit'];
};

FlowApi.prototype.init = function(targetUrl) {
    var self = this;
    this.target = $('#relay')[0].contentWindow;
    self.targetUrl = targetUrl;
    XD.receiveMessage(function(message) { self.receiveMessage(message); });
}

FlowApi.prototype.sendMessage = function(method) {
    var args = Array.prototype.slice.call(arguments, 1);
    var message = [method, args];
    var messageString = $.toJSON(message);
    XD.postMessage(messageString, this.targetUrl, this.target);
};

FlowApi.prototype.receiveMessage = function(message) {
    var messageString = message.data;
    var decodedMessage = $.parseJSON(messageString);
    var method = decodedMessage[0];
    var args = decodedMessage[1];
    if ($.inArray(method, this.validMethods) > -1) {
        this[method].apply(this, args);
    }
};

FlowApi.prototype.verify = function(filename) {
    // Set up the global verifyAuth function which the loaded authentication script will call, then load it
    var self = this;
    window.verifyAuth = function(token) {
        self.verifyAuth(token);
    }

    $.getScript('js/' + filename + '.js').fail(function(jqxhr, settings, exception) {
        alert("Unable to open authentication file: " + exception);
    });
};

FlowApi.prototype.verifyAuth = function(token) {
    this.sendMessage('verifyAuth', token);
};

FlowApi.prototype.authSuccessful = function() {
    // Now authorised, so get student details and send them back to Flow
    var details = this.getStudentDetails();
    this.sendMessage('identifyStudent', details[0], details[1]);
};

FlowApi.prototype.getStudentDetails = function() {
    throw "NotImplemented";
}

FlowApi.prototype.started = function() {
}

FlowApi.prototype.getLessonStatus = function() {
    // Return the current lesson status to Flow
    this.sendMessage('setLessonStatus', this.get_lesson_status());
}

FlowApi.prototype.get_lesson_status = function() {
    throw "NotImplemented";
}

FlowApi.prototype.getLessonLocation = function() {
    // Return the current lesson status to Flow
    this.sendMessage('setLessonLocation', this.get_lesson_location());
}

FlowApi.prototype.get_lesson_location = function() {
    throw "NotImplemented";
}

FlowApi.prototype.getTotalTime = function() {
    // Return the LMS total time to Flow
    this.sendMessage('setTotalTime', this.get_total_time());
}

FlowApi.prototype.get_total_time = function() {
    throw "NotImplemented";
}

FlowApi.prototype.set_session_location = function() {
}

FlowApi.prototype.set_session_time = function() {
}

FlowApi.prototype.finished = function(result, nQuestions, nCorrect) {
}

FlowApi.prototype.quit = function() {
}
