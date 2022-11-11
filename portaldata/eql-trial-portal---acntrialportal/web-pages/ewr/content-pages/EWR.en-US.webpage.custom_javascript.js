let rftddateselected = $('div.control').find("[id*='eql_readyfortestdate']").parent();
$(rftddateselected).on("dp.change",function(e){

    debugger;
    let readyfortestDate = $("#eql_readyfortestdate").val();
    let formattedrftd = new Date(readyfortestDate).toISOString().slice(0,10);
    const today = new Date();
    let futuredate = today.setMonth(today.getMonth()+3);
    let formattedfuturedate = new Date(futuredate).toISOString().slice(0,10);
    if(formattedrftd < formattedfuturedate)
    {
      $("#eql_readyfortestdate").addClass('errorClass');
     }
     else{
      
     }
  });