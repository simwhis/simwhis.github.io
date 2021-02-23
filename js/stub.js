LmsApi = function() {
    var self = this;
    self.api = null;
    self.nFindApiTries = 0;
    if ((window.parent) && (window.parent != window)) {
        self.api = self.findApi(window.parent);
    }
    if ((self.api == null) && (window.opener != null)) {
        self.api = self.findApi(window.opener);
    }
    if (self.api == null) {
        alert("No API adapter found");
    } else {
        self.start();
    }
};

LmsApi.prototype.findApi = function(win) {
    while ((win.API == null) && (win.parent != null) && (win.parent != win)) {
        this.nFindApiTries++;
            if (this.nFindApiTries > 500) {
                alert("Error in finding Api -- too deeply nested.");
                return null;
            }
        win = win.parent;
    }
    return win.API;
};

LmsApi.prototype.start = function() {
    if (this.api != null) {
        this.api.LMSInitialize("");
    }
};

LmsApi.prototype.finish = function() {
    if (this.api != null) {
        this.api.LMSFinish("");
    }
};

LmsApi.prototype.displayError = function(prefix) {
    var errorCode = this.api.LMSGetLastError();
    var errorString = this.api.LMSGetErrorString(errorCode);
    var errorDiagnostic = this.api.LMSGetDiagnostic(errorCode);
    if (typeof(prefix) == "undefined") {
        prefix = "Error";
    }
    alert(prefix + ": " + errorString + "\n" + errorDiagnostic);
}

LmsApi.prototype.getValue = function(name) {
    return this.api.LMSGetValue(name);
};

LmsApi.prototype.setValue = function(name, value) {
    var result = this.api.LMSSetValue(name, value);
    if (result == "false") {
        this.displayError("Error setting " + name + " to " + value);
    } else {
        result = this.api.LMSCommit("");
        if (result == "false") {
            this.displayError("Error committing value of " + name + ", set to " + value);
        }
    }
};


FullScormFlowApi = function() {};
FullScormFlowApi.prototype = new FlowApi();
FullScormFlowApi.prototype.constructor = FullScormFlowApi;

FullScormFlowApi.prototype.init = function(targetUrl, lmsApi) {
    FlowApi.prototype.init.call(this, targetUrl);
    this.lmsApi = lmsApi;
    this.initialTimeSpentAt = new Date();
    $(window).on('beforeunload', function() {
        this.quit();
    });
}

FullScormFlowApi.prototype.getStudentDetails = function() {
    var studentId = this.lmsApi.getValue('cmi.core.student_id');
    var studentName = this.lmsApi.getValue('cmi.core.student_name');
    return [studentId, studentName];
}

FullScormFlowApi.prototype.get_lesson_status = function() {
    var lesson_status = this.lmsApi.getValue('cmi.core.lesson_status');
    return lesson_status;
}

FullScormFlowApi.prototype.get_lesson_location = function() {
    var lesson_location = this.lmsApi.getValue('cmi.core.lesson_location');
    return lesson_location;
}

FullScormFlowApi.prototype.set_lesson_location = function(data) {
    this.lmsApi.setValue('cmi.core.lesson_location', data);
}

FullScormFlowApi.prototype.millisecondsToTime = function(duration) {
    var seconds = parseInt((duration/1000)%60);
    var minutes = parseInt((duration/(1000*60))%60);
    var hours = parseInt((duration/(1000*60*60)));

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;
    return hours + ":" + minutes + ":" + seconds;
}

FullScormFlowApi.prototype.set_session_time = function() {
    elapsed = parseInt((new Date() - this.initialTimeSpentAt), 10);
    var formattedDuration = this.millisecondsToTime(elapsed);
    this.lmsApi.setValue('cmi.core.session_time', formattedDuration);
};

FullScormFlowApi.prototype.timeToMilliseconds = function(timestring) {
    var timevals = timestring.split(":", 3);
    var hours = parseInt(timevals[0], 10);
    var minutes = parseInt(timevals[1], 10);
    var seconds = parseInt(timevals[2], 10);

    var milliseconds = seconds * 1000 + (minutes * 60 * 1000) + (hours * 60 * 60 * 1000);
    if (isNaN(milliseconds)) {
        milliseconds=0;
    }
    return milliseconds;
}

FullScormFlowApi.prototype.get_total_time = function() {
    var total_time = this.lmsApi.getValue('cmi.core.total_time');
    return this.timeToMilliseconds(total_time);
};

FullScormFlowApi.prototype.started = function() {
    this.initialTimeSpentAt = new Date();
    this.lmsApi.start();
    this.lmsApi.setValue('cmi.core.lesson_status', 'incomplete');
};

FullScormFlowApi.prototype.finished = function(result, nQuestions, nCorrect) {
    this.lmsApi.setValue('cmi.core.lesson_status', result == 'PASS' ? 'passed' : 'failed');
    this.lmsApi.setValue('cmi.core.score.min', 0);
    this.lmsApi.setValue('cmi.core.score.max', nQuestions);
    this.lmsApi.setValue('cmi.core.score.raw', nCorrect);
    this.set_session_time();
};

FullScormFlowApi.prototype.quit = function() {
    this.set_session_time();
    this.lmsApi.finish();
};

initCommunication = function() {
    var lmsApi = new LmsApi();
    var flowApi = new FullScormFlowApi();
    flowApi.init($('#relay').attr('src'), lmsApi);
};

