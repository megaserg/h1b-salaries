window.qbaka || (function(a,c){
    a.__qbaka_eh=a.onerror;
    a.__qbaka_reports=[];
    a.onerror=function() {
        a.__qbaka_reports.push(arguments);
        if(a.__qbaka_eh)
            try{
                a.__qbaka_eh.apply(a,arguments)
            }catch(b){}
    };
    a.onerror.qbaka=1;
    a.qbaka={
        report:function(){
            a.__qbaka_reports.push([arguments, new Error()]);
        },
        customParams:{},
        set:function(a,b){
            qbaka.customParams[a]=b
        },
        exec:function(a){
            try{
                a()
            }
            catch(b){
                qbaka.reportException(b)
            }
        },
        reportException:function(){}
    };
    var b=c.createElement("script"),
        e=c.getElementsByTagName("script")[0],
        d=function(){e.parentNode.insertBefore(b,e)};
    b.type="text/javascript";
    b.async=!0;
    b.src=('https:'==document.location.protocol?'https:':'http:')+'//cdn.qbaka.net/reporting.js';
    "[object Opera]"==a.opera?c.addEventListener("DOMContentLoaded",d):d();
    qbaka.key="c115e15a73834087b443a5cc55eb5d27"
})(window,document);
qbaka.options={autoStacktrace:1,trackEvents:1};
