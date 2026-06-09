import { EXCEPTION_REASONS } from './constants.js'

const sfData = {
  company: 'sf',
  format: 'sf',
  orders: {
    'SF1234567890': {
      trackingNo: 'SF1234567890',
      isSigned: true,
      signer: '张三',
      signTime: '2026-06-08 15:30:00',
      origin: '深圳',
      destination: '北京',
      routes: [
        {
          acceptTime: '2026-06-08 15:30:00',
          acceptAddress: '北京市朝阳区某某小区',
          remark: '已签收，签收人：张三',
          opcode: '80',
        },
        {
          acceptTime: '2026-06-08 09:15:00',
          acceptAddress: '北京市朝阳区营业点',
          remark: '快件正在派送中，派送员：李四 电话：13800138000',
          opcode: '70',
        },
        {
          acceptTime: '2026-06-08 06:00:00',
          acceptAddress: '北京转运中心',
          remark: '快件已到达【北京转运中心】',
          opcode: '40',
        },
        {
          acceptTime: '2026-06-07 22:30:00',
          acceptAddress: '武汉转运中心',
          remark: '快件已从【武汉转运中心】发出，下一站：北京转运中心',
          opcode: '30',
        },
        {
          acceptTime: '2026-06-07 14:20:00',
          acceptAddress: '深圳转运中心',
          remark: '快件已从【深圳转运中心】发出，下一站：武汉转运中心',
          opcode: '30',
        },
        {
          acceptTime: '2026-06-07 10:05:00',
          acceptAddress: '深圳市南山区营业点',
          remark: '顺丰速运 已收取快件',
          opcode: '10',
        },
      ],
    },
    'SF9998887776': {
      trackingNo: 'SF9998887776',
      isSigned: false,
      hasException: true,
      exceptionCode: 'BAD_ADDRESS',
      origin: '上海',
      destination: '成都',
      routes: [
        {
          acceptTime: '2026-06-09 11:00:00',
          acceptAddress: '成都市武侯区营业点',
          remark: '派送异常：地址不详，无法派送，正在联系收件人',
          opcode: '99',
        },
        {
          acceptTime: '2026-06-09 08:30:00',
          acceptAddress: '成都市武侯区营业点',
          remark: '快件正在派送中，派送员：王五 电话：13900139000',
          opcode: '70',
        },
        {
          acceptTime: '2026-06-09 04:00:00',
          acceptAddress: '成都转运中心',
          remark: '快件已到达【成都转运中心】',
          opcode: '40',
        },
        {
          acceptTime: '2026-06-08 18:00:00',
          acceptAddress: '西安转运中心',
          remark: '快件已从【西安转运中心】发出，下一站：成都转运中心',
          opcode: '30',
        },
        {
          acceptTime: '2026-06-08 10:00:00',
          acceptAddress: '上海转运中心',
          remark: '快件已从【上海转运中心】发出，下一站：西安转运中心',
          opcode: '30',
        },
        {
          acceptTime: '2026-06-08 08:00:00',
          acceptAddress: '上海市浦东新区营业点',
          remark: '顺丰速运 已收取快件',
          opcode: '10',
        },
      ],
    },
  },
}

const ytData = {
  company: 'yt',
  format: 'yt',
  orders: {
    'YT1234567890123': {
      number: 'YT1234567890123',
      status: '已签收',
      statusCode: 'SIGNED',
      senderCity: '广州',
      receiverCity: '杭州',
      signerName: '前台代收',
      signTime: '2026-06-07 14:20:00',
      data: [
        {
          time: '2026-06-07 14:20:00',
          location: '杭州市西湖区',
          status: '已签收',
          details: '客户已签收',
          operator: '前台代收',
        },
        {
          time: '2026-06-07 09:10:00',
          location: '杭州市西湖区古墩路网点',
          status: '派送中',
          details: '业务员赵六正在派送',
          operator: '赵六',
        },
        {
          time: '2026-06-07 06:30:00',
          location: '杭州转运中心',
          status: '到达',
          details: '快件已到达杭州转运中心',
        },
        {
          time: '2026-06-06 20:00:00',
          location: '长沙转运中心',
          status: '发出',
          details: '快件已从长沙转运中心发出',
        },
        {
          time: '2026-06-06 10:00:00',
          location: '广州市天河区营业点',
          status: '揽收',
          details: '圆通速递已揽收',
        },
      ],
    },
  },
}

const ztData = {
  company: 'zt',
  format: 'zt',
  orders: {
    'ZT777888999000': {
      billCode: 'ZT777888999000',
      signed: false,
      signedName: null,
      signTime: null,
      from: '南京',
      to: '青岛',
      traces: [
        {
          scanDate: '2026-06-09 07:45:00',
          scanLocation: '青岛市市南区网点',
          scanType: '派送中',
          desc: '【青岛市市南区】 业务员孙七正在第1次派件 电话:13700137000',
        },
        {
          scanDate: '2026-06-09 05:20:00',
          scanLocation: '青岛转运中心',
          scanType: '到达',
          desc: '快件到达 【青岛转运中心】',
        },
        {
          scanDate: '2026-06-08 21:30:00',
          scanLocation: '济南转运中心',
          scanType: '发出',
          desc: '快件离开 【济南转运中心】 已发往 【青岛转运中心】',
        },
        {
          scanDate: '2026-06-08 12:00:00',
          scanLocation: '南京转运中心',
          scanType: '发出',
          desc: '快件离开 【南京转运中心】 已发往 【济南转运中心】',
        },
        {
          scanDate: '2026-06-08 09:00:00',
          scanLocation: '南京市鼓楼区网点',
          scanType: '已揽收',
          desc: '中通快递 已揽收',
        },
      ],
    },
    'ZT111222333444': {
      billCode: 'ZT111222333444',
      signed: true,
      signedName: '李女士',
      signTime: '2026-06-06 16:00:00',
      from: '苏州',
      to: '合肥',
      traces: [
        {
          scanDate: '2026-06-06 16:00:00',
          scanLocation: '合肥市蜀山区网点',
          scanType: '已签收',
          desc: '已签收，签收人：李女士',
        },
        {
          scanDate: '2026-06-06 09:30:00',
          scanLocation: '合肥市蜀山区网点',
          scanType: '派送中',
          desc: '业务员正在派送',
        },
        {
          scanDate: '2026-06-06 04:00:00',
          scanLocation: '合肥转运中心',
          scanType: '到达',
          desc: '快件到达合肥转运中心',
        },
        {
          scanDate: '2026-06-05 20:00:00',
          scanLocation: '南京转运中心',
          scanType: '发出',
          desc: '快件离开南京转运中心',
        },
        {
          scanDate: '2026-06-05 10:00:00',
          scanLocation: '苏州市姑苏区网点',
          scanType: '已揽收',
          desc: '中通快递已揽收',
        },
      ],
    },
  },
}

const ydData = {
  company: 'yd',
  format: 'yd',
  orders: {
    'YD5556667778': {
      mailNo: 'YD5556667778',
      signStatus: '1',
      originationName: '厦门',
      destinationName: '沈阳',
      signer: '本人',
      signTimestamp: '2026-06-05 16:00:00',
      result: [
        {
          time: '2026-06-05 16:00:00',
          location: '沈阳市和平区',
          context: '已签收,签收人是:【本人签收】',
          state: '签收',
        },
        {
          time: '2026-06-05 08:30:00',
          location: '沈阳市和平区三好街网点',
          context: '辽宁沈阳和平区三好街公司-派送中',
          state: '派送中',
        },
        {
          time: '2026-06-05 03:00:00',
          location: '沈阳转运中心',
          context: '到达沈阳转运中心',
          state: '到达',
        },
        {
          time: '2026-06-04 10:00:00',
          location: '北京转运中心',
          context: '从北京转运中心发出',
          state: '运输中',
        },
        {
          time: '2026-06-03 14:00:00',
          location: '厦门转运中心',
          context: '从厦门转运中心发出',
          state: '运输中',
        },
        {
          time: '2026-06-03 10:00:00',
          location: '厦门市思明区网点',
          context: '韵达快递 已揽收',
          state: '揽收',
        },
      ],
    },
  },
}

const jdData = {
  company: 'jd',
  format: 'jd',
  orders: {
    'JD000111222333': {
      waybillCode: 'JD000111222333',
      finished: true,
      startProvince: '天津',
      endProvince: '重庆',
      receiver: '本人',
      receivedTime: '2026-06-04 11:00:00',
      detailList: [
        {
          operatorTime: '2026-06-04 11:00:00',
          operatorContact: '重庆市渝中区解放碑营业部',
          content: '您的订单已签收，签收人：本人',
          statusCode: 50,
        },
        {
          operatorTime: '2026-06-04 08:00:00',
          operatorContact: '重庆市渝中区解放碑营业部',
          content: '快递员周八正在为您派送，电话：13600136000',
          statusCode: 40,
        },
        {
          operatorTime: '2026-06-04 02:00:00',
          operatorContact: '重庆分拨中心',
          content: '货物已到达重庆分拨中心',
          statusCode: 30,
        },
        {
          operatorTime: '2026-06-03 15:00:00',
          operatorContact: '武汉分拨中心',
          content: '货物已从武汉分拨中心发出',
          statusCode: 20,
        },
        {
          operatorTime: '2026-06-03 08:00:00',
          operatorContact: '天津市和平区营业部',
          content: '京东快递已收取快件',
          statusCode: 10,
        },
      ],
    },
  },
}

const emsData = {
  company: 'ems',
  format: 'ems',
  orders: {
    'EMS3334445556': {
      trackingNumber: 'EMS3334445556',
      deliveryStatus: 'delivered',
      signedBy: '本人',
      signedAt: '2026-06-06 15:45:00',
      originCity: '郑州',
      destCity: '长沙',
      steps: [
        {
          occurTime: '2026-06-06 15:45:00',
          city: '长沙市',
          orignist: 'EMS',
          description: '已妥投，本人签收',
          type: 'delivered',
        },
        {
          occurTime: '2026-06-06 09:00:00',
          city: '长沙市岳麓区',
          orignist: 'EMS',
          description: '投递并签收',
          type: 'delivering',
        },
        {
          occurTime: '2026-06-06 05:00:00',
          city: '长沙邮区中心局',
          orignist: 'EMS',
          description: '到达长沙邮区中心局邮件处理中心',
          type: 'arrival',
        },
        {
          occurTime: '2026-06-05 20:00:00',
          city: '武汉邮区中心局',
          orignist: 'EMS',
          description: '离开武汉邮区中心局邮件处理中心，下一站：长沙邮区中心局',
          type: 'departure',
        },
        {
          occurTime: '2026-06-05 11:00:00',
          city: '郑州市二七区',
          orignist: 'EMS',
          description: 'EMS已揽收',
          type: 'pickup',
        },
      ],
    },
    'EMS1112223334': {
      trackingNumber: 'EMS1112223334',
      deliveryStatus: 'exception',
      exceptionType: 'DAMAGED',
      originCity: '苏州',
      destCity: '合肥',
      steps: [
        {
          occurTime: '2026-06-09 12:00:00',
          city: '合肥市包河区',
          orignist: 'EMS',
          description: '异常：包裹外包装破损，正在核实处理',
          type: 'exception',
        },
        {
          occurTime: '2026-06-09 08:30:00',
          city: '合肥邮区中心局',
          orignist: 'EMS',
          description: '到达合肥邮区中心局邮件处理中心',
          type: 'arrival',
        },
        {
          occurTime: '2026-06-08 22:00:00',
          city: '南京邮区中心局',
          orignist: 'EMS',
          description: '离开南京邮区中心局，下一站：合肥邮区中心局',
          type: 'departure',
        },
        {
          occurTime: '2026-06-08 14:00:00',
          city: '苏州市姑苏区',
          orignist: 'EMS',
          description: 'EMS已揽收',
          type: 'pickup',
        },
      ],
    },
  },
}

export function getMockDataByCompany(companyId) {
  const dataMap = {
    sf: sfData,
    yt: ytData,
    zt: ztData,
    yd: ydData,
    jd: jdData,
    ems: emsData,
  }
  return dataMap[companyId] || null
}

export function getExceptionReason(code) {
  return EXCEPTION_REASONS[code] || '未知异常'
}

export function getAllMockOrders() {
  return [sfData, ytData, ztData, ydData, jdData, emsData]
}
