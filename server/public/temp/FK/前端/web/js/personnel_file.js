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

    

    laydate.render({
        elem:'.clue-time',
        type: 'datetime',
        range: true
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
                        text: '进行中'
                    },
                    {
                        id: 1,
                        text: '暂停'
                    },
                    {
                        id: 2,
                        text: '结束'
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

    $(document).on("click",".add-case-icon",function(){
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
                        text: '进行中'
                    },
                    {
                        id: 1,
                        text: '暂停'
                    },
                    {
                        id: 2,
                        text: '结束'
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

    $(".case-status").on('click',function(event){ 
        var e = arguments.callee.arguments[0] || event;
        if(e && e.stopPropagation) {
            e.stopPropagation();
        } else {
            window.event.cancelBubble = true;
        }
        $(this).parent('p').after('<ul class="case-status-select">\
            <li><a href="javascript:;" data-val="0">进行中</a></li>\
            <li><a href="javascript:;" data-val="1">暂停</a></li>\
            <li><a href="javascript:;" data-val="2">结案</a></li>\
        </ul>');

    });


