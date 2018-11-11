function init() {
    initTemplate();
    initEvent();
}

function initTemplate() {
    $(".case-manage-detail .detail-content.case-detail-change").html(template('case-detail-popover'));

    $(".case-manage-detail .detail-content.clue-detail-change").html(template('clue-detail-popover'));

    $(".case-manage-detail .detail-content.deal-record-change").html(template('deal-record-popover'));

    $(".case-manage-detail .detail-content.involved-case-change").html(template('involved-case-popover'));
}

function initEvent() {
    //分页
    $(".clue-pagin").pagination({
        totalrows: 100,
        pagesize: 10,
        pageno: 1
    });

    $(".involve-pagin").pagination({
        totalrows: 100,
        pagesize: 10,
        pageno: 1
    });
}

init();

$(".detail-header").on('click','ul li',function(){
    $(this).addClass('active').siblings().removeClass('active');

    var value = $(this).attr('data-value');
    if(value == 0) {
        $(".case-manage-detail .detail-content.case-detail-change").show().siblings('.detail-content').hide();
    } else if(value == 1) {
        $(".case-manage-detail .detail-content.clue-detail-change").show().siblings('.detail-content').hide();
    } else if(value == 2) {
        $(".case-manage-detail .detail-content.deal-record-change").show().siblings('.detail-content').hide();
    } else if(value == 3) {
        $(".case-manage-detail .detail-content.involved-case-change").show().siblings('.detail-content').hide();
    }
});


$('.detail-content').on('click','.get-more',function(){
    $('.detail-content').find('.disposal-record').append('<li>\
        <p class="recoed-title">\
            <span class="icon-dot"></span>\
            <span>2018-07-28   11:00</span>\
        </p>\
        <div class="record-content">\
            <p><i class="icon icon-qq"></i> <span>13:25:12   与7个QQ好友通联，其中1个重点人</span></p>\
            <p><i class="icon icon-z"></i> <span>10:17:11   在新浪微博发帖1篇</span></p>\
            <p><i class="icon icon-weibo"></i> <span>10:17:11   在新浪微博发帖1篇</span></p>\
        </div>\
    </li>')
})
 

$($(".detail-header ul li")[0]).trigger("click");