//日历
laydate.render({
    elem:'.find-time',
    type: 'datetime',
    range: true
});
//下拉
var types =[
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
$('.clue-type').select2({
    //  minimumResultsForSearch设置为-1，去除搜索框 
    minimumResultsForSearch:-1,
    width:150,
    data:types
});
//分页
$(".pagin").pagination({
    totalrows: 100,
    pagesize: 10,
    pageno: 1
});

//创建线索弹窗
$(document).on("click",".add-clue",function(){
    Dialog.open({ 
        title:"创建线索", 
        width:"1000", 
        height:"auto", 
        content:template("add-clue-popover"),
        button: [
            {id:"mybtn1", label:"创建", intent:"primary", focus:true, click:function(){
                alert('ok！');
            }},
            {id:"mybtn2", label:"取消", click:function(){
                alert('cancel');
            }}
        ],
        //打开弹窗回调
        onShow:function(){
           //下拉
            var types =[
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
            $('.clue-type2').select2({
                //  minimumResultsForSearch设置为-1，去除搜索框 
                minimumResultsForSearch:-1,
                width:150,
                data:types
            });

            laydate.render({
                elem:'.clue-time',
                type: 'datetime',
                range: true
            });
            
        }
    });
});

//线索详情
$(document).on("click",".look-detail",function(){
    Dialog.open({ 
        title:"线索详情", 
        width:"1000", 
        height:"auto", 
        content:template("clue-detail-popover"),
        button: [
            {id:"mybtn1", label:"创建案件", intent:"primary", focus:true, click:function(){
                alert('ok！');
            }},
            {id:"mybtn2", label:"取消", click:function(){
                alert('cancel');
            }}
        ],
        //打开弹窗回调
        onShow:function(){
           //表格
            // 对象方式数据源
            var data = [
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "<span class='dot st'></span>一级",
                    "a3": "50%"
                },
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "<span class='dot nd'></span>二级",
                    "a3": "50%"
                },
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "<span class='dot'></span>三级",
                    "a3": "50%"
                },
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "<span class='dot'></span>三级",
                    "a3": "50%"
                }
            ];

            // 然后 DataTables 这样初始化：
            $('#detailTable').DataTable({
                data: data,
                // 使用对象数组，一定要配置columns，告诉 DataTables 每列对应的属性
                // data 这里是固定不变的，name，position，salary，office 为你数据里对应的属性
                // 关闭翻页功能
                paging: false,
                // 关闭搜索功能
                searching: false,
                // 去除info（左下角的文字）
                info: false,
                // 是否开启排序功能
                // ordering: false,
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
                    { data: 'a1' },
                    { data: 'a2' },
                    { data: 'a3' }
                ]
            });

            $(".detail-pagin").pagination({
                totalrows: 100,
                pagesize: 10,
                pageno: 1
            });
            
        }
    });
});
// 创建案件
$(document).on("click",".add-case",function(){
    Dialog.open({ 
        title:"创建案件", 
        width:"1000", 
        height:"auto", 
        content:template("add-case-popover"),
        button: [
            {id:"mybtn1", label:"创建", intent:"primary", focus:true, click:function(){
                alert('ok！');
            }},
            {id:"mybtn2", label:"取消", click:function(){
                alert('cancel');
            }}
        ],
        //打开弹窗回调
        onShow:function(){
           //创建案件，选人事件
            $(".check-item").on("click",function(){
                $(this).toggleClass("checked");
            });         
        }
    });
});

// 创建案件添加
$(document).on("click",".add-case-btn",function(){
    Dialog.open({ 
        title:"人员添加", 
        width:"1000", 
        height:"auto", 
        content:template("case-popover-add"),
        button: [
            {id:"add", label:"添加", intent:"primary", focus:true, click:function(){
                alert('ok！');
            }},
            {id:"cancel", label:"取消", click:function(){
                alert('cancel');
            }}
        ],
        //打开弹窗回调
        onShow:function(){
            
            var data = [
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "3512458746",
                    "a3": "15954784562"
                },
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "3512458746",
                    "a3": "15954784562"
                },
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "3512458746",
                    "a3": "15954784562"
                },
                {
                    "checkbox": "",
                    "a1": "<span class='color-blue'>张某某</span>",
                    "a2": "3512458746",
                    "a3": "15954784562"
                }
            ];

            // 然后 DataTables 这样初始化：
            $('#detailTable').DataTable({
                data: data,
                // 使用对象数组，一定要配置columns，告诉 DataTables 每列对应的属性
                // data 这里是固定不变的，name，position，salary，office 为你数据里对应的属性
                // 关闭翻页功能
                paging: false,
                // 关闭搜索功能
                searching: false,
                // 去除info（左下角的文字）
                info: false,
                // 是否开启排序功能
                // ordering: false,
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
                    { data: 'a1' },
                    { data: 'a2' },
                    { data: 'a3' }
                ]
            });

            $(".detail-pagin").pagination({
                totalrows: 100,
                pagesize: 10,
                pageno: 1
            });        
        }
    });
});

// 全选黑产人员
$(document).on('click','.case-select-all',function(){
    if($(this).children('span').text() == '全选') {
        $(this).children('span').text('反选');
        $(this).parents(".case-person").find('dd a').addClass('checked');
    }else {
        $(this).children('span').text('全选');
        $(this).parents(".case-person").find('dd a').removeClass('checked');
    }
    console.log();
})