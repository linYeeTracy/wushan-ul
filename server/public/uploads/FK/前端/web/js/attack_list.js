    //日历
    laydate.render({
        elem:'.attack-time',
        type: 'datetime',
        range: true
    });
    //分页
    $(".pagin").pagination({
        totalrows: 100,
        pagesize: 10,
        pageno: 1
    });

    $(document).on("click",".open-detail",function(){
        // window.open("./attack_detail.html");
        window.location.href = "./attack_detail.html";
    });