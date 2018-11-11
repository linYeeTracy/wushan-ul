var app = {
    init:function(){
        this.initFilters();
        this.initTable();
        this.bindEvents();
    },
    initFilters:function(){
        //初始化日历
        laydate.render({
            elem:'#createTime',
            type: 'datetime',
            range: true
        });
        //下拉框
        var caseName = [
            {
                id: 0,
                text: '请选择事件名称'
            },
            {
                id: 1,
                text: '一句话木马'
            },
            {
                id: 2,
                text: 'webshell'
            }
        ];
        $('.case-name-select').select2({
            //  minimumResultsForSearch设置为-1，去除搜索框 
            minimumResultsForSearch:-1,
            width:200,
            data:caseName
        });
        var states =[
            {
                id: 0,
                text: '所有'
            },
            {
                id: 1,
                text: '正在处置'
            },
            {
                id: 2,
                text: '处置完成'
            },
            {
                id: 3,
                text: '通报处置'
            }
        ];
        $('.state-select').select2({
            //  minimumResultsForSearch设置为-1，去除搜索框 
            minimumResultsForSearch:-1,
            width:200,
            data:states
        });
        var affiliation =[
            {
                id: 0,
                text: '全部'
            },
            {
                id: 1,
                text: '南京'
            },
            {
                id: 2,
                text: '苏州'
            },
            {
                id: 3,
                text: '无锡'
            }
        ];
        $('.affiliation-select').select2({
            //  minimumResultsForSearch设置为-1，去除搜索框 
            minimumResultsForSearch:-1,
            width:200,
            data:affiliation
        });
    },
    initTable:function(){
        var table21 = $('#datatable').DataTable({
            // 当表格在处理的时候（比如排序操作）是否显示“处理中...”
            processing: true,
            // 是否开启服务器模式
            serverSide: true,
            // 定义在render时是否仅仅render显示的dom
            deferRender: true,
            // 全局控制列表的翻页功能
            paging: true,
            // 关闭搜索功能
            searching: false,
            columnDefs: [{
                orderable: false,
                className: 'select-checkbox ',
                targets: 0
            }],
            select: {
                // 可选择的配置有： 'api'、'single'、'multi'、'os'、'multi+shift'
                style: 'multi',
                // 控制是否在左下角显示选中信息
                info: false,
                selector: 'td:first-child'
            },
            order: [[1, 'asc']],
            columns: [
                { data: "checkbox" },
                { data: "a1" },
                { data: "a2" },
                { data: "a3" },
                { data: "a4" },
                { data: "a5" },
                { data: "a6" },
                { data: "a7" },
                { data: "a8" },
                { data: "a9" }
            ],
            ajax: function (params, callback, setting) {
                $.ajax({
                    url: "./js/data.json",
                    type: "GET",
                    dataType: "json",
                    success: function (res) {
                        // 数据位模拟数据，字段自己命名，与表头对应
                        var dataTemp = [];
                        var obj = {
                            data: []
                        };
                        for (var i = 0; i < res.data.length; i++) {
                            var obj2 = {};
                            obj2['checkbox'] = '';
                            obj2['a1'] = res.data[i]["a1"];
                            obj2['a2'] = res.data[i]["a2"];
                            obj2['a3'] = res.data[i]["a3"];
                            obj2['a4'] = '<a href="javascript:;">'+res.data[i]["a4"]+'</a>';
                            obj2['a5'] = '<a href="javascript:;">'+res.data[i]["a5"]+'</a>';
                            obj2['a6'] = res.data[i]["a6"];
                            obj2['a7'] = res.data[i]["a7"];
                            obj2['a8'] = res.data[i]["a8"];
                            obj2['a9'] = '<a href="javascript:;" class="tb-opt download"><i class="aidicon aidicon-download"></i>下载</a>'+
                                        '<a href="javascript:;" class="tb-opt dispose" data-toggle="popover" ></i>处理</a>'+
                                        '<a href="javascript:;" class="tb-opt backfile"><i class="aidicon aidicon-file-document"></i>归档</a>';
                            dataTemp.push(obj2);
                        }
                        obj.data = dataTemp;
                        obj.draw = res.draw;
                        obj.recordsTotal = res.recordsTotal;
                        obj.recordsFiltered = res.recordsTotal;
                        callback(obj);
                        $('.dispose').popover({
                            html:true,
                            title:"开始处置",
                            trigger:"click",
                            placement:"left",
                            content:template("dispose-popover")
                        }).on('show.bs.popover', function () {
                            $(this).addClass("opened");
                        }).on('hide.bs.popover', function () {
                            $(this).removeClass("opened");
                        })
                    }
                })
            }
        });
    },
    bindEvents:function(){
        $(document).on("click",".add-new-info",function(){
            Dialog.open({ 
                title:"新增等保情报", 
                width:"700", 
                height:"600", 
                content:template("add-dialog"),
                button: [
                    {id:"mybtn1", label:"确认", intent:"primary", focus:true, click:function(){
                        alert('ok！');
                    }},
                    {id:"mybtn2", label:"取消", click:function(){
                        alert('cancel');
                    }}
                ],
                //打开弹窗回调
                onShow:function(){
                    app.initUpload();
                    //初始化日历
                    laydate.render({
                        elem:'#checkTime',
                        type: 'datetime',
                        range: false
                    });
                    var affiliation2 =[
                        {
                            id: 0,
                            text: '全部'
                        },
                        {
                            id: 1,
                            text: '南京'
                        },
                        {
                            id: 2,
                            text: '苏州'
                        },
                        {
                            id: 3,
                            text: '无锡'
                        }
                    ];
                    $('.add-affiliation-select').select2({
                        //  minimumResultsForSearch设置为-1，去除搜索框 
                        minimumResultsForSearch:-1,
                        width:300,
                        data:affiliation2
                    });
                }
            });
        });
        $(document).on("click",".close-card",function(){
            $('.opened').trigger("click");
        });
    },
    //初始化上传组件
    initUpload:function(){
        //实例化一个plupload上传对象  
        var uploader = new plupload.Uploader({  
            //触发文件选择对话框的按钮，为那个元素id  
            browse_button : 'chose_file', 
            filters: {
                mime_types : [ //只允许上传doc和zip文件
                    // { title : "Image files", extensions : "jpg,gif,png" }, 
                    { title : "Office files", extensions : "doc,docx" }, 
                    { title : "Zip files", extensions : "rar,zip" }
                ],
            },
            //服务器端的上传页面地址  
            url : "http://frontend.njsecnet.com:3002/upload", 
            flash_swf_url : './fh-ui/js/plugins/plupload/Moxie.swf', //swf文件，当需要使用swf方式进行上传时需要配置该参数  
            silverlight_xap_url : './fh-ui/js/plugins/plupload/Moxie.xap' //silverlight文件，当需要使用silverlight方式进行上传时需要配置该参数
        });      
        //当文件添加到上传队列后触发  
        uploader.bind('FilesAdded',function(uploader,files){  
            uploader.start();  
        });  
        //当队列中的某一个文件上传完成后触发  
        uploader.bind('FileUploaded',function(uploader,file,responseObject){  
            console.log("上传成功！"); 
        });  
        //会在文件上传过程中不断触发，可以用此事件来显示上传进度  
        uploader.bind('UploadProgress',function(uploader,file){  
            alert('上传进行中');   
        });  
        //在实例对象上调用init()方法进行初始化  
        uploader.init();
    }
}

app.init();