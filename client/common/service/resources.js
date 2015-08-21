/**
 * Created by Ting on 2015/5/11.
 */
angular.module('ylbWxApp')
  .value('ylb.resources', {
    sex: {
      1: '男',
      2: '女'
    },
    role: {
      doctor: 'doctor',
      patient: 'patient'
    },
    doctorLevel: {
      1: '普通',
      2: '正式',
      3: '实名'
    },
    patientLevel: {
      1: '普通',
      2: '正式'
    },
    relationStatus: {
      normal: {value: 1},
      jiwang: {value: 2},
      suizhen: {value: 3}
    },
    doctorServices: {
      jiahao: {type: 'jiahao', label: "加号"},
      huizhen: {type: 'huizhen', label: "会诊"},
      suizhen: {type: 'suizhen', label: "随诊"}
    },
    orderTypes: {
      shop: {type: 'shop', label: "商城"},
      withdraw: {type: 'withdraw', label: "提取"}
    },
    orderStatus: {
      init: {value: 'init', label: '未支付'},
      paid: {value: 'paid', label: '已支付'},
      confirmed: {value: 'confirmed', label: '已确认'}, // doctor confirmed
      rejected: {value: 'rejected', label: '已拒绝'},   //doctor rejected
      doctorFinished: {value: 'doctorFinished', label: '医生已完成'},
      finished: {value: 'finished', label: '已完成'},   // patient accept 'doctorFinished' status.
      expired: {value: 'expired', label: '已失效'},
      cancelled: {value: 'cancelled', label: '已取消'}
    },
    linkTypes: {
      image: {value: 'image', label: '图片', forPatient: true, forDoctor: true},
      doctor: {value: 'doctor', label: '医生', forPatient: true, forDoctor: true},
      patient: {value: 'patient', label: '患者', forPatient: true, forDoctor: true},
      shop: {value: 'shop', label: '商城', forPatient: true, forDoctor: true},
      medicalImaging: {value: 'medicalImaging', label: '影像', forPatient: false, forDoctor: true},
      serviceJiahao: {value: 'serviceJiahao', label: '加号', forPatient: false, forDoctor: true},
      serviceSuizhen: {value: 'serviceSuizhen', label: '随诊', forPatient: false, forDoctor: true},
      serviceHuizhen: {value: 'serviceHuizhen', label: '会诊', forPatient: false, forDoctor: true}
    },
    defaultAvatar: '/assets/image/avatar-64.jpg',
    defaultIcon: {
      jiahao: '/assets/image/icon-jiahao.png',
      suizhen: '/assets/image/icon-suizhen.png',
      huizhen: '/assets/image/icon-huizhen.png',
      madicalImaging: '/assets/image/icon-medical-imaging.png'
    },
    defaultMedicalImagingTitle: '影像学资料',
    days: {
      d0: '周日',
      d1: '周一',
      d2: '周二',
      d3: '周三',
      d4: '周四',
      d5: '周五',
      d6: '周六'
    },
    province: {
      "1": "北京",
      "2": "上海",
      "3": "天津",
      "4": "重庆",
      "5": "河北",
      "6": "山西",
      "7": "河南",
      "8": "辽宁",
      "9": "吉林",
      "10": "黑龙江",
      "11": "内蒙古",
      "12": "江苏",
      "13": "山东",
      "14": "安徽",
      "15": "浙江",
      "17": "湖北",
      "16": "福建",
      "19": "广东",
      "18": "湖南",
      "21": "江西",
      "20": "广西",
      "23": "海南",
      "22": "四川",
      "25": "云南",
      "24": "贵州",
      "27": "陕西",
      "26": "西藏",
      "29": "青海",
      "28": "甘肃",
      "31": "新疆",
      "30": "宁夏",
      "32": "台湾",
      "42": "香港",
      "43": "澳门"
    },
    city: {
      "1": {
        "2810": "大兴区",
        "2808": "房山区",
        "2809": "通州区",
        "2814": "怀柔区",
        "2812": "顺义区",
        "2816": "密云区",
        "2953": "平谷区",
        "2802": "东城区",
        "2803": "崇文区",
        "2800": "海淀区",
        "2801": "西城区",
        "72": "朝阳区",
        "2806": "石景山区",
        "2807": "门头沟",
        "2804": "宣武区",
        "2805": "丰台区",
        "3065": "延庆县",
        "2901": "昌平区"
      },
      "2": {
        "2822": "虹口区",
        "2823": "杨浦区",
        "2820": "闸北区",
        "2815": "长宁区",
        "2813": "徐汇区",
        "2919": "崇明县",
        "2817": "静安区",
        "2830": "浦东新区",
        "78": "黄浦区",
        "2826": "嘉定区",
        "2824": "宝山区",
        "2825": "闵行区",
        "2837": "奉贤区",
        "2835": "金山区",
        "2834": "松江区",
        "2833": "青浦区",
        "2841": "普陀区"
      },
      "3": {
        "51039": "河西区",
        "51038": "河东区",
        "51037": "河北区",
        "51036": "和平区",
        "51035": "东丽区",
        "51044": "塘沽区",
        "51045": "西青区",
        "51046": "武清区",
        "51047": "津南区",
        "51040": "红桥区",
        "51041": "蓟县",
        "51042": "静海县",
        "51043": "南开区",
        "51052": "宁河县",
        "51048": "汉沽区",
        "51049": "大港区",
        "51050": "北辰区",
        "51051": "宝坻区"
      },
      "4": {
        "137": "石柱县",
        "136": "巫山县",
        "139": "垫江县",
        "50995": "綦江区",
        "138": "彭水县",
        "141": "秀山县",
        "140": "酉阳县",
        "129": "武隆县",
        "128": "黔江区",
        "131": "奉节县",
        "130": "丰都县",
        "133": "云阳县",
        "132": "开县",
        "135": "巫溪县",
        "134": "忠县",
        "4164": "城口县",
        "51028": "北部新区",
        "51027": "高新区",
        "51026": "渝中区",
        "48131": "璧山县",
        "119": "南川区",
        "50950": "江北区",
        "115": "梁平县",
        "50951": "南岸区",
        "114": "涪陵区",
        "48133": "铜梁县",
        "113": "万州区",
        "48132": "荣昌县",
        "50954": "大渡口区",
        "48207": "永川区",
        "48206": "长寿区",
        "126": "大足区",
        "50952": "九龙坡区",
        "48205": "渝北区",
        "48204": "江津区",
        "50953": "沙坪坝区",
        "48203": "北碚区",
        "123": "潼南县",
        "48202": "巴南区",
        "48201": "合川区"
      },
      "5": {
        "239": "承德市",
        "275": "衡水市",
        "258": "唐山市",
        "274": "廊坊市",
        "248": "秦皇岛市",
        "142": "石家庄市",
        "199": "保定市",
        "264": "沧州市",
        "148": "邯郸市",
        "224": "张家口市",
        "164": "邢台市"
      },
      "6": {
        "325": "晋城市",
        "309": "大同市",
        "398": "运城市",
        "368": "吕梁市",
        "336": "晋中市",
        "350": "忻州市",
        "3074": "长治市",
        "330": "朔州市",
        "379": "临汾市",
        "318": "阳泉市",
        "303": "太原市"
      },
      "7": {
        "517": "商丘市",
        "549": "信阳市",
        "2780": "济源市",
        "475": "濮阳市",
        "412": "郑州市",
        "446": "焦作市",
        "502": "南阳市",
        "468": "安阳市",
        "527": "周口市",
        "438": "平顶山市",
        "495": "三门峡市",
        "427": "洛阳市",
        "489": "漯河市",
        "458": "新乡市",
        "454": "鹤壁市",
        "420": "开封市",
        "482": "许昌市",
        "538": "驻马店市"
      },
      "8": {
        "579": "鞍山市",
        "609": "营口市",
        "613": "盘锦市",
        "584": "抚顺市",
        "617": "阜新市",
        "589": "本溪市",
        "621": "辽阳市",
        "593": "丹东市",
        "6858": "铁岭市",
        "560": "沈阳市",
        "598": "锦州市",
        "573": "大连市",
        "632": "朝阳市",
        "604": "葫芦岛市"
      },
      "9": {
        "687": "延边州",
        "664": "白山市",
        "681": "白城市",
        "651": "四平市",
        "644": "吉林市",
        "2992": "辽源市",
        "639": "长春市",
        "674": "松原市",
        "657": "通化市"
      },
      "10": {
        "712": "齐齐哈尔市",
        "737": "鸡西市",
        "742": "大庆市",
        "793": "大兴安岭地区",
        "773": "七台河市",
        "731": "双鸭山市",
        "698": "哈尔滨市",
        "765": "佳木斯市",
        "782": "绥化市",
        "753": "伊春市",
        "776": "黑河市",
        "727": "鹤岗市",
        "757": "牡丹江市"
      },
      "11": {
        "880": "巴彦淖尔市",
        "835": "锡林郭勒盟",
        "805": "包头市",
        "823": "乌兰察布市",
        "848": "呼伦贝尔市",
        "870": "鄂尔多斯市",
        "812": "赤峰市",
        "799": "呼和浩特市",
        "902": "通辽市",
        "891": "阿拉善盟",
        "895": "兴安盟",
        "810": "乌海市"
      },
      "12": {
        "984": "无锡市",
        "925": "淮安市",
        "959": "泰州市",
        "988": "苏州市",
        "978": "常州市",
        "919": "连云港市",
        "951": "扬州市",
        "911": "徐州市",
        "939": "盐城市",
        "904": "南京市",
        "972": "镇江市",
        "933": "宿迁市",
        "965": "南通市"
      },
      "13": {
        "1016": "淄博市",
        "1032": "潍坊市",
        "1022": "枣庄市",
        "1099": "菏泽市",
        "1058": "莱芜市",
        "1025": "东营市",
        "1060": "德州市",
        "1090": "滨州市",
        "1000": "济南市",
        "1081": "聊城市",
        "1053": "威海市",
        "1112": "泰安市",
        "1007": "青岛市",
        "2900": "济宁市",
        "1108": "日照市",
        "1042": "烟台市",
        "1072": "临沂市"
      },
      "14": {
        "1132": "蚌埠市",
        "1159": "滁州市",
        "1127": "芜湖市",
        "1124": "淮北市",
        "1167": "阜阳市",
        "1121": "淮南市",
        "1151": "黄山市",
        "1116": "合肥市",
        "1201": "池州市",
        "1206": "六安市",
        "2971": "宣城市",
        "1174": "亳州市",
        "1114": "铜陵市",
        "1140": "安庆市",
        "1180": "宿州市",
        "1137": "马鞍山市"
      },
      "15": {
        "1255": "绍兴市",
        "1290": "台州市",
        "1250": "湖州市",
        "1233": "温州市",
        "1158": "宁波市",
        "1262": "金华市",
        "1298": "舟山市",
        "1280": "丽水市",
        "1273": "衢州市",
        "1243": "嘉兴市",
        "1213": "杭州市"
      },
      "17": {
        "1405": "十堰市",
        "1458": "咸宁市",
        "1396": "襄阳市",
        "2980": "天门市",
        "1466": "恩施州",
        "2922": "潜江市",
        "1432": "孝感市",
        "2983": "仙桃市",
        "3154": "神农架林区",
        "1479": "随州市",
        "1441": "黄冈市",
        "1477": "荆门市",
        "1475": "鄂州市",
        "1413": "荆州市",
        "1387": "黄石市",
        "1381": "武汉市",
        "1421": "宜昌市"
      },
      "16": {
        "1341": "漳州市",
        "1370": "宁德市",
        "1352": "南平市",
        "1329": "莆田市",
        "1315": "厦门市",
        "1303": "福州市",
        "1362": "龙岩市",
        "1332": "泉州市",
        "1317": "三明市"
      },
      "19": {
        "1609": "珠海市",
        "1643": "惠州市",
        "1611": "汕头市",
        "1698": "云浮市",
        "1666": "佛山市",
        "1677": "湛江市",
        "1634": "梅州市",
        "1601": "广州市",
        "1709": "揭阳市",
        "1672": "阳江市",
        "1705": "潮州市",
        "1704": "清远市",
        "1607": "深圳市",
        "1684": "茂名市",
        "1659": "江门市",
        "1627": "河源市",
        "1657": "中山市",
        "1617": "韶关市",
        "1650": "汕尾市",
        "1655": "东莞市",
        "1690": "肇庆市"
      },
      "18": {
        "1495": "湘潭市",
        "1544": "郴州市",
        "1522": "岳阳市",
        "1488": "株洲市",
        "1540": "张家界市",
        "1574": "怀化市",
        "1501": "衡阳市",
        "1499": "韶山市",
        "1530": "常德市",
        "1511": "邵阳市",
        "1560": "永州市",
        "1592": "湘西州",
        "1586": "娄底市",
        "1482": "长沙市",
        "1555": "益阳市"
      },
      "21": {
        "1836": "萍乡市",
        "1898": "吉安市",
        "1832": "景德镇市",
        "1885": "抚州市",
        "1845": "九江市",
        "1874": "宜春市",
        "1857": "鹰潭市",
        "1911": "赣州市",
        "1861": "上饶市",
        "1842": "新余市",
        "1827": "南昌市"
      },
      "20": {
        "1761": "玉林市",
        "1818": "河池市",
        "3044": "来宾市",
        "1740": "梧州市",
        "1806": "百色市",
        "1746": "北海市",
        "1715": "南宁市",
        "1749": "防城港市",
        "1726": "桂林市",
        "1753": "钦州市",
        "1757": "贵港市",
        "1792": "贺州市",
        "3168": "崇左市",
        "1720": "柳州市"
      },
      "23": {
        "3707": "琼中县",
        "3706": "白沙县",
        "3705": "昌江县",
        "3704": "屯昌县",
        "3711": "三沙市",
        "3710": "乐东县",
        "3709": "保亭县",
        "3708": "陵水县",
        "3699": "五指山市",
        "3698": "文昌市",
        "3703": "定安县",
        "3702": "澄迈县",
        "3701": "临高县",
        "3034": "儋州市",
        "3690": "三亚市",
        "3115": "琼海市",
        "3173": "东方市",
        "3137": "万宁市",
        "2121": "海口市"
      },
      "22": {
        "2065": "资阳市",
        "2033": "达州市",
        "2103": "凉山州",
        "2005": "宜宾市",
        "2070": "阿坝州",
        "1950": "攀枝花市",
        "2042": "巴中市",
        "1983": "遂宁市",
        "1946": "自贡市",
        "1977": "广元市",
        "2047": "雅安市",
        "2016": "广安市",
        "2084": "甘孜州",
        "2022": "南充市",
        "1988": "内江市",
        "1954": "泸州市",
        "1993": "乐山市",
        "2058": "眉山市",
        "1930": "成都市",
        "1960": "绵阳市",
        "1962": "德阳市"
      },
      "25": {
        "2336": "楚雄州",
        "2235": "昆明市",
        "2304": "丽江市",
        "2270": "昭通市",
        "2298": "保山市",
        "2309": "文山州",
        "2347": "大理州",
        "2318": "红河州",
        "2291": "临沧市",
        "4108": "迪庆州",
        "2258": "玉溪市",
        "2281": "普洱市",
        "2360": "德宏州",
        "2247": "曲靖市",
        "2332": "西双版纳州",
        "2366": "怒江州"
      },
      "24": {
        "2150": "六盘水市",
        "2189": "安顺市",
        "2222": "黔南州",
        "2205": "黔东南州",
        "2144": "贵阳市",
        "2196": "黔西南州",
        "2180": "毕节市",
        "2155": "遵义市",
        "2169": "铜仁市"
      },
      "27": {
        "2442": "汉中市",
        "2390": "宝鸡市",
        "2476": "安康市",
        "2416": "渭南市",
        "2386": "铜川市",
        "2402": "咸阳市",
        "2428": "延安市",
        "2454": "榆林市",
        "2468": "商洛市",
        "2376": "西安市"
      },
      "26": {
        "3129": "山南地区",
        "3971": "林芝地区",
        "3144": "日喀则地区",
        "3970": "阿里地区",
        "2951": "拉萨市",
        "3107": "那曲地区",
        "3138": "昌都地区"
      },
      "29": {
        "2580": "西宁市",
        "2612": "玉树州",
        "2597": "黄南州",
        "2592": "海北州",
        "2620": "海西州",
        "2605": "果洛州",
        "2585": "海东地区",
        "2603": "海南州"
      },
      "28": {
        "2509": "嘉峪关市",
        "2501": "天水市",
        "2534": "陇南市",
        "2556": "酒泉市",
        "2564": "甘南州",
        "3080": "定西市",
        "2525": "庆阳市",
        "2492": "金昌市",
        "2495": "白银市",
        "2518": "平凉市",
        "2573": "临夏州",
        "2549": "张掖市",
        "2544": "武威市",
        "2487": "兰州市"
      },
      "31": {
        "2675": "阿克苏地区",
        "2744": "阿勒泰地区",
        "2714": "昌吉州",
        "4163": "博尔塔拉蒙古自治州阿拉山口口岸",
        "2704": "巴音郭楞州",
        "2652": "乌鲁木齐市",
        "2686": "喀什地区",
        "2736": "塔城地区",
        "4110": "五家渠市",
        "2654": "克拉玛依市",
        "2658": "吐鲁番地区",
        "15946": "图木舒克市",
        "15945": "阿拉尔市",
        "2656": "石河子市",
        "2662": "哈密地区",
        "2699": "克孜勒苏州",
        "2727": "伊犁州",
        "2666": "和田地区",
        "2723": "博尔塔拉州"
      },
      "30": {"2628": "银川市", "2644": "固原市", "3071": "中卫市", "2632": "石嘴山市", "2637": "吴忠市"},
      "32": {"2768": "台湾"},
      "42": {"2754": "香港特别行政区"},
      "43": {"2770": "澳门市"}
    }
  });
