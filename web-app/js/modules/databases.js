function DBListCtrl($scope, $http, $timeout, mongodb) {
    $scope.creatingDB = false;
    $scope.copyingDB = false;
    $scope.renamingCol = false;
    $scope.creatingCol = false;
    $scope.newDbname = null;
    $scope.newColname = null;
    $scope.renColName = null;

    $scope.currentDB = null;
    $scope.currentDBSize = 0;
    $scope.totalSize = 0;
    $scope.currentCollection = null;

    $scope.databases = {};
    $scope.collections = [];
    $scope.documents = [];
    $scope.totalCount = 0;
    $scope.editors = {};

    $scope.currentAction= "find";
    $scope.queriesActions = ["find", "findOne", "update", "insert", "remove"];

    $scope.init = function(selectedDB, selectedCol) {
        mongodb.listDatabases().success(function(data) {
            $scope.databases = data.databases;
            $scope.totalSize = data.totalSize;
            if(selectedDB != null) {
                $scope.selectdb(selectedDB);
            }
            if(selectedCol != null) {
                $scope.selectCollection(selectedCol);
            }
        });
    };

    $scope.homepage = function() {
        $scope.cancel();
        $scope.currentDB = null;
        $scope.currentCollection = null;
        $scope.collections = [];
        $scope.documents = [];
    };

    $scope.focus = function(inputId) {
        $timeout(function() {
            $('input#'+inputId).attr('tabindex', -1).focus();
        }, 10);
    };

    $scope.populateDocuments = function(data) {
        if(data.results != null) {
            $scope.documents = data.results;
        } else {
            if(data != null) {
                $scope.documents = data;
            } else {
                $scope.documents = [];
            }
        }

        if(data.totalCount != null) {
            $scope.totalCount = data.totalCount;
        } else {
            $scope.totalCount = $scope.documents.length;
        }
    };

    $scope.selectdb = function(dbname) {
        $scope.cancel();
        $scope.currentDB = dbname;
        $scope.currentDBSize = $scope.databases[dbname].sizeOnDisk;
        $scope.currentCollection = null;
        $scope.documents = [];
        $scope.populateDocuments([]);

        mongodb.use(dbname).success(function(data) {
            $scope.collections = data;
        });

    };

    $scope.selectCollection = function(colname, params) {
        $scope.cancel();
        $scope.currentCollection = colname;
        $scope.renColName = colname;
        var args = {};
        var offset = params != undefined ?params.offset : null;
        var max = params != undefined ? params.max : null;

        mongodb[colname].find().skip(offset).limit(max).exec(function(data) {
            $scope.populateDocuments(data);
        }, function(data){alert(data);});
    };

    $scope.createDB = function() {
        $scope.cancel();
        $scope.creatingDB = true;
        $("#createDB").modal({show: true});
        $scope.focus("inputName");
    };

    $scope.copyDB = function() {
        $scope.cancel();
        $("#copyDB").modal({show: true});
        $scope.copyingDB = true;
        $scope.focus("inputCopy");
    };

    $scope.renameCol = function(inputId) {
        $scope.cancel();
        $scope.renamingCol = true;
        //$("#renameCol").modal({show: true});
        $scope.focus(inputId);
    };

    $scope.createCol = function(inputId) {
        $scope.cancel();
        //$scope.documents = [];
        $scope.creatingCol = true;
        $("#createCol").modal({show: true});

        $timeout(function() {
            $scope.focus(inputId);
        }, 500);
    };

    $scope.createDoc = function() {
        $scope.cancel();
        $scope.creatingDoc = true;
        $("#createDoc").modal({show: true});
        $scope.setEditable("new-doc", true);
        $scope.focus("#new-doc");
    };

    $scope.validateDBCreation = function() {
        var newDbname = $scope.newDbname;

        mongodb.createDatabase(newDbname)
            .success(function(data) {
                $scope.currentDB = newDbname;
                $scope.currentCollection = null;
                $scope.cancel();
                $scope.databases = data.databases;
                $scope.populateDocuments([]);
                mongodb($scope.currentDB).success(function(data) {
                    $scope.collections = data;
                });
            });
    };

    $scope.validateColnameChange = function() {
        var newColname = $scope.renColName;
        mongodb[$scope.currentCollection].renameCollection(newColname)
            .success(function(data) {
                $scope.currentCollection = newColname;
                $scope.cancel();
                mongodb($scope.currentDB).success(function(data) {
                    $scope.collections = data;
                });
            });
    };

    $scope.validateCreateCollection = function() {
        var newColname = $scope.newColname;
        mongodb.createCollection(newColname)
            .success(function(data) {
                $scope.currentCollection = newColname;
                $scope.cancel();
                mongodb($scope.currentDB).success(function(data) {
                    $scope.collections = data;
                });
            }).error(function(data){
                alert(data);
            });
    };

    $scope.validateCreateDocument = function() {
        var editor = $scope.editors["new-doc"];
        var newDocument = MongoJSON.parse(editor.getValue());
        mongodb[$scope.currentCollection].insert(newDocument).success(function() {
            $scope.selectCollection($scope.currentCollection);
        });
    };

    $scope.dropCol = function() {
        bootbox.confirm("This action cannot be undone. Drop the collection '" + $scope.currentCollection + "' from the db '"+$scope.currentDB + "'?", function(confirm){
        //if(confirm("This action cannot be undone. Drop the collection '" + $scope.currentCollection + "' from the db '"+$scope.currentDB + "'?")) {
            if (confirm) {
                mongodb[$scope.currentCollection].dropCollection()
                    .success(function(data) {
                        $scope.currentCollection = null;
                        $scope.cancel();
                        mongodb($scope.currentDB).success(function(data) {
                            $scope.collections = data;
                    });
                });
            }

        });
    };

    $scope.dropDB = function() {
        bootbox.confirm("This action cannot be undone. Drop the database '"+$scope.currentDB + "'?", function(confirm){
            //if(confirm("This action cannot be undone. Drop the database '"+$scope.currentDB + "'?")) {
            if (confirm) {
                mongodb.dropDatabase()
                    .success(function(data) {
                        $scope.currentDB = null;
                        $scope.currentCollection = null;
                        $scope.currentDBSize = 0;
                        $scope.cancel();
                        $scope.databases = data.databases;
                        $scope.collections = [];
                        $scope.populateDocuments([]);
                    });
            }

        });
    };

    $scope.deleteDocument = function(id) {
        bootbox.confirm("This action cannot be undone. Delete this document ?", function(confirm){
            if (confirm) {
                // Drop database
            }
        });
    }

    $scope.cancel = function() {
        $scope.creatingDB = false;
        $scope.copyingDB = false;
        $scope.renamingCol = false;
        $scope.creatingCol = false;
        $scope.renColName = $scope.currentCollection;
        $scope.newColname = null;
        $scope.newDbname = null;
        $('.modal').modal('hide');
    };

    $scope.$on('PaginationChangeEvent', function(event, params){
        $scope.selectCollection($scope.currentCollection, params);
    });

    $scope.submitFindQuery = function() {
        var query = $scope.findQuery;
        var fields = $scope.fields != undefined ? $scope.fields : "";
        var cur;
        if($scope.currentAction == 'find') {
            cur = mongodb[$scope.currentCollection].find(MongoJSON.parse('{'+query+'}'), JSON.parse('{' + fields + '}'));
            if($scope.hasSort) {
                cur.sort(MongoJSON.parse('{'+$scope.sort+'}'));
            }
            if($scope.hasLimit) {
                cur.limit($scope.limit)
            }
            if($scope.hasSkip) {
                cur.skip($scope.skip)
            }
        } else if($scope.currentAction == 'findOne') {
            cur = mongodb[$scope.currentCollection].findOne(MongoJSON.parse('{'+query+'}'));
        }
        cur.exec(function(data){
            $scope.populateDocuments(data);
        });
    };

    $scope.submitChange = function(editorId, documentId, originalDocument) {
        var editor = $scope.editors[editorId];
        var newDocument = MongoJSON.parse(editor.getValue());
        var docId;
        if(typeof originalDocument._id === 'object' && typeof originalDocument._id.toStrictJSON === 'function') {
            docId = originalDocument._id.toStrictJSON();
        } else {
            docId = originalDocument._id;
        }
        mongodb[$scope.currentCollection].update({_id:docId}, newDocument).success(function(data) {
            $scope.selectCollection($scope.currentCollection);
        });
    };

    // TODO : this should be done elsewhere
    $scope.setEditable = function(id, enable) {
        if(enable) {
            $("#" + id).css("height", $("#" + id).height());
            var editor = ace.edit(id);
            editor.setTheme("ace/theme/merbivore_soft");
            editor.setShowInvisibles(false);
            editor.setShowPrintMargin(false);
            editor.getSession().setMode("ace/mode/json");
            $scope.editors[id] = editor;
        } else {
            $scope.editors[id].destroy();
        }

    };
}

function parseMongoJson(data, headerGetter) {
    return MongoJSON.parse(data, mongoJsonReviver);
}