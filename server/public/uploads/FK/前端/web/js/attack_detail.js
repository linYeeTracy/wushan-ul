//日历
laydate.render({
    elem:'.attack-time',
    type: 'datetime',
    range: true
});
//地址
var areas =[
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
$('.case-area').select2({
    //  minimumResultsForSearch设置为-1，去除搜索框 
    minimumResultsForSearch:-1,
    width:170,
    data:areas
});
//分页
$("#casePagin").pagination({
    totalrows: 100,
    pagesize: 10,
    pageno: 1
});
$("#ipPagin").pagination({
    totalrows: 100,
    pagesize: 10,
    pageno: 1
});
//表格
// 对象方式数据源
var data = [
    {
        "a1": "121.255.223.12",
        "a2": "<p>开始时间：2018-08-08 21:21:31</p><p>结束时间：2018-08-08 21:21:31</p>",
        "a3": "攻击次数<i class='frequency'>50</i>次",
        "a4": "<span class='fail-icon'></span>",
        "a5": "已成为线索",
        "a6": "<span class='enter-clue'>添加进线索</span>"
    },
    {
        "a1": "121.255.223.12",
        "a2": "<p>开始时间：2018-08-08 21:21:31</p><p>结束时间：2018-08-08 21:21:31</p>",
        "a3": "攻击次数<i class='frequency'>50</i>次",
        "a4": "<span class='succeed-icon'></span>",
        "a5": "未成为线索",
        "a6": "<span class='enter-clue'>添加进线索</span>"
    },
    {
        "a1": "121.255.223.12",
        "a2": "<p>开始时间：2018-08-08 21:21:31</p><p>结束时间：2018-08-08 21:21:31</p>",
        "a3": "攻击次数<i class='frequency'>50</i>次",
        "a4": "<span class='succeed-icon'></span>",
        "a5": "未成为线索",
        "a6": "<span class='enter-clue'>添加进线索</span>"
    },
    {
        "a1": "121.255.223.12",
        "a2": "<p>开始时间：2018-08-08 21:21:31</p><p>结束时间：2018-08-08 21:21:31</p>",
        "a3": "攻击次数<i class='frequency'>50</i>次",
        "a4": "<span class='succeed-icon'></span>",
        "a5": "未成为线索",
        "a6": "<span class='enter-clue'>添加进线索</span>"
    },
    {
        "a1": "121.255.223.12",
        "a2": "<p>开始时间：2018-08-08 21:21:31</p><p>结束时间：2018-08-08 21:21:31</p>",
        "a3": "攻击次数<i class='frequency'>50</i>次",
        "a4": "<span class='succeed-icon'></span>",
        "a5": "未成为线索",
        "a6": "<span class='enter-clue'>添加进线索</span>"
    }
];

// 然后 DataTables 这样初始化：
$('#datatable').DataTable({
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
    columns: [
        { data: 'a1' },
        { data: 'a2' },
        { data: 'a3' },
        { data: 'a4' },
        { data: 'a5' },
        { data: 'a6' }
    ]
});