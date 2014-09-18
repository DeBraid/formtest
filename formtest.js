if (Meteor.isClient) {

  Meteor.subscribe("docs");
  Meteor.subscribe("dates");

  var contactCB = {
    after: {
      sendEmail: function() {
        console.log("after sendEmail hook");
      }
    },
    beginSubmit: function (formId, template) {
      template.$('[data-schema-key],button').attr("disabled", "");
    },
    endSubmit: function (formId, template) {
      template.$('[data-schema-key],button').removeAttr("disabled");
    }
  };

  AutoForm.hooks({
    docForm: {
      before: {
        insert: function(doc) {
          console.log("before.insert received document", doc);
          return doc;
        }
      },
      docToForm: function(doc) {
        if (_.isArray(doc.optionalStringArray)) {
          doc.optionalStringArray = doc.optionalStringArray.join(", ");
        }
        return doc;
      },
      formToDoc: function(doc) {
        if (typeof doc.optionalStringArray === "string") {
          doc.optionalStringArray = doc.optionalStringArray.split(",");
        }
        return doc;
      }
    },
    contactForm: contactCB,
    contactForm2: contactCB,
    contactForm3: contactCB,
    personsForm: {
      before: {
        remove: function(id) {
          var name = Persons.findOne(id).fullName;
          return confirm("Remove " + name + "?");
        }
      }
    }
  });

  AutoForm.addHooks(['docForm', 'datesForm1', 'datesForm2', 'datesForm3', 'myQuickForm'], {
    after: {
      insert: function(error, result) {
        if (error) {
          console.log("Insert Error:", error);
        } else {
          console.log("Insert Result:", result);
        }
      },
      update: function(error) {
        if (error) {
          console.log("Update Error:", error);
        } else {
          console.log("Updated!");
        }
      },
      remove: function(error) {
        console.log("Remove Error:", error);
      }
    }
  });

  AutoForm.addHooks(null, {
    onSubmit: function () {
      console.log("onSubmit ALL FORMS!", arguments);
    }
  });

  Documents.simpleSchema().validator(function(key, val, def) {
    if (val === "d") {
      return "noD";
    }
    return true;
  });

  Template.formtest.docsCollection = function() {
    return Documents;
  };

  Template.formtest.selectedDoc = function() {
    return Documents.findOne(Session.get("selectedDoc"));
  };

  Template.formtest.newDocMode = function() {
    return !Session.get("selectedDoc");
  };

  Template.example.tester = {};

  Template.datesForm.today = function() {
    return dateToDateString(new Date);
  };

  UI.body.testData = function bodyTestDataHelper() {
    if (Session.get("selectedDoc")) {
      return {docFormType: "update"};
    } else {
      return {docFormType: "insert"};
    }
  };

  var dateToDateString = function(date) {
    var m = (date.getMonth() + 1);
    if (m < 10) {
      m = "0" + m;
    }
    var d = date.getDate();
    if (d < 10) {
      d = "0" + d;
    }
    return date.getFullYear() + '-' + m + '-' + d;
  };

  Template.docTable.documents = function() {
    return Documents.find();
  };

  Template.formtest.events({
    'click .docSelect': function(e, t) {
      e.preventDefault();
      AutoForm.resetForm("docForm");
      Session.set("selectedDoc", this._id);
    },
    'click .docClear': function(e, t) {
      e.preventDefault();
      AutoForm.resetForm("docForm");
      Session.set("selectedDoc", null);
    }
  });

  UI.registerHelper("log", function(what, who) {
    console.log(what, who);
  });


  AutoForm.inputValueHandlers({
      '[data-schema-key=oid]' : function() {
        console.log("OID CALLED");
          return [new Meteor.Collection.ObjectID()];
      }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    
    Meteor.publish("docs", function() {
      return Documents.find();
    });

  });


  _.each([Documents, Dates, FieldValueIs, FieldValueContains], function (collection) {
    collection.allow({
      insert: function() {
        return true;
      },
      update: function() {
        return true;
      },
      remove: function() {
        return true;
      },
      fetch: []
    });
  });

  Meteor.publish("docs", function() {
    return Documents.find();
  });

  Meteor.publish("dates", function() {
    return Dates.find();
  });

  Meteor.methods({
    sendEmail: function(doc) {
      check(doc, Schemas.ContactForm);
      var text = "Name: " + doc.name + "\n\n"
              + "Email: " + doc.email + "\n\n\n\n"
              + doc.message;

      console.log("Sent E-mail:\n\n" + text);
      sleep(4000); //simulate real delay
      return true;
    }
  });
}

var Schemas = {};

function sleep(ms) {
  var done = Date.now() + ms;
  while (Date.now() < done) { /* do nothing */
  }
}