﻿$(function () {

    // Task Model
    var Task = Backbone.Model.extend({
        idAttribute: "Id",
        url: function () {
            var base = '/Tasks';
            if (this.isNew())
                return base;
            return base + (base.charAt(base.length - 1) == '/' ? '' : '/') + this.id;
        },
        initialize: function () {
            console.log('Task Constructor Triggered');
        },
        defaults: {
            Id: null,
            Content: 'Unknown',
            Date: 'Unknown',
            IsDone: false
        },
        destroy: function (options) {
            console.log('/Tasks/delete/' + this.id);
            var opts = _.extend({ url: '/Tasks/delete/' + this.id }, options || {});
            return Backbone.Model.prototype.destroy.call(this, opts);
        },
        save: function () {
            var model = this;
            
            $.ajax({
                url: '/Tasks/Create',
                type: 'POST',
                data: model.toJSON(),
                success: function (data) {
                    model.set('Id', data.Id);
                }
            });
        }
    });

    // Task Collection
    var TaskCollection = Backbone.Collection.extend({
        model: Task,
        url: '/Tasks/GetAll/',
        initialize: function () {
            this.bind("reset", function (model, options) {
                console.log("Inside event");
                console.log(model);

            })
        }
    });

    // Task View - el returns the template enclosed within a tr
    var TaskView = Backbone.View.extend({
        template: _.template($('#Task-Template').html()),
        tagName: "tr",
        initialize: function () {
            console.log('TaskView Constructor Triggered');
            this.model.bind('change', this.render, this);
            this.model.bind('remove', this.unrender, this);
        },
        render: function () {
            console.log('Rendering...');
            $(this.el).html(this.template(this.model.toJSON()));
            return this;
        },
        unrender: function () {
            console.log('Un-Rendering...');
            $(this.el).remove();
            return this;
        },
        events: {
            "click .TaskEdit": 'EditTask',
            "click .Delete": 'DeleteTask'
        },
        EditTask: function () {
            var model = this;
            var data = this.model.toJSON();
            console.log(moment(data.Date).toDate());

            var now = moment(data.Date).toDate();
            var day = ("0" + now.getDate()).slice(-2);
            var month = ("0" + (now.getMonth() + 1)).slice(-2);

            var today = (now.getFullYear() + '-' + month + '-' + day);

            $(".modal-body #editTaskIdInput").val(data.Id);
            $(".modal-body #editTaskContentInput").val(data.Content);
            $(".modal-body #editTaskDateInput").val(today);

            var id = data.Id;
            if (data.IsDone == true) {
                $('#editTaskIsDoneInput')[0].checked = true;
                $('#task-' + id + '-checkbox')[0].checked = true;
            }

            else
            {
                $('#editTaskIsDoneInput')[0].checked = false;
                $('#task-' + id + '-checkbox')[0].checked = false;
            }
               
        },
        DeleteTask: function () {
            this.model.destroy();
        }
    });

    // Actual App view
    var AppView = Backbone.View.extend({
        initialize: function () {
            this.collection.bind('add', this.AppendTask, this);
        },
        el: '#Task_Container',
        counter: 20  ,
        events: {
            "click #btnCreateNew": "AddNewTask",
            "click #SaveChanges": "EditExistingTask"
        },
        AddNewTask: function () {
            console.log('Add Task....');
            this.counter++;
            var newTask = new Task({ Content: $('#newTaskContentInput').val(), Date: $('#newTaskDateInput').val(), IsDone: false });
            this.collection.add(newTask);
            newTask.save();
        },
        EditExistingTask: function () {
            var model = this.collection.get($('#editTaskIdInput').val());
            model.set('Content', $('#editTaskContentInput').val() );
            model.set('Date', $('#editTaskDateInput').val());
            if ($('#editTaskIsDoneInput')[0].checked == true)
                model.set('IsDone', true);
            else
                model.set('IsDone', false);

            $.ajax({
                url: '/Tasks/Edit/' + model.toJSON().Id,
                type: 'POST',
                data: model.toJSON(),
                success: function (data) {
                    console.log(data);
                }
            });

        },
        AppendTask: function (task) {
            var taskView = new TaskView({ model: task });
            $(this.el).find('table').append(taskView.render().el);
        },
        render: function () {
            if (this.collection.length > 0) {
                this.collection.each(this.AppendTask, this);
            }
            $("input:button", "#Task_List").button();
        }
    });

    var tasks = new TaskCollection();

    tasks.fetch({
        success: function (response, xhr) {
            console.log("Inside success");
            console.log(response);
        },
        error: function (errorResponse) {
            console.log(errorResponse)
        }
    });


    var view = new AppView({ collection: tasks });
    
});

