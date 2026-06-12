export const PRESET_RULES = [
  {
    id: 'phone',
    name: '手机号脱敏',
    pattern: '1\\d{10}',
    replacement: '$1****$2',
    groupPattern: '(1\\d{2})(\\d{4})(\\d{4})',
    description: '匹配1开头的11位数字',
    example: '13812345678 → 138****5678',
    category: 'preset',
    enabled: true,
  },
  {
    id: 'email',
    name: '邮箱脱敏',
    pattern: '[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}',
    replacement: '$1***@$2',
    groupPattern: '([a-zA-Z0-9._%+\\-])[a-zA-Z0-9._%+\\-]*@([a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,})',
    description: '保留第一个字符和@后域名',
    example: 'test@example.com → t***@example.com',
    category: 'preset',
    enabled: true,
  },
  {
    id: 'idcard',
    name: '身份证脱敏',
    pattern: '[1-9]\\d{5}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]',
    replacement: '$1********$2',
    groupPattern: '([1-9]\\d{5})\\d{8}(\\d{4})',
    description: '18位身份证保留前6位和后4位',
    example: '110101199001011234 → 110101********1234',
    category: 'preset',
    enabled: true,
  },
  {
    id: 'bankcard',
    name: '银行卡号脱敏',
    pattern: '\\d{13,19}',
    replacement: '$1****$2',
    groupPattern: '(\\d{4})\\d{8,15}(\\d{4})',
    description: '保留后4位，前面替换为****',
    example: '6222021234567890123 → 6222****0123',
    category: 'preset',
    enabled: true,
  },
]

export const SAMPLE_TEXT = `客户信息记录：

姓名：张三，手机：13812345678，邮箱：zhangsan@example.com
身份证号：110101199001011234，银行卡：6222021234567890123

姓名：李四，手机：15698765432，邮箱：lisi@company.org
身份证号：320102198512126789，银行卡：6217001234561234567

订单日志：
用户 test_user@163.com 下单，联系电话 18900001111
支付卡号 6228481234567890001，确认手机号 13711112222`
