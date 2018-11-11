$('.static-select').select2({
    //  minimumResultsForSearch设置为-1，去除搜索框 
    minimumResultsForSearch:-1,
    width:200
});

var table21 = $('#datatable2').DataTable({
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
        { data: "a8" }
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
                    obj2['a8'] = res.data[i]["a8"]
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