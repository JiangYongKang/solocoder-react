import { describe, it, expect } from 'vitest';
import {
  formatPrice,
  getDiscountPercent,
  generateId,
  getNextCarouselIndex,
  getPrevCarouselIndex,
  getClampedCarouselIndex,
  buildSpecKey,
  getInitialSpecs,
  addToBag,
  updateBagQuantity,
  removeFromBag,
  clearBag,
  calcBagSubtotal,
  calcBagCount,
  getBestApplicableCoupon,
  calcBagTotal,
  padZero,
  formatCountdown,
  pickRandom,
  createDanmaku,
  pushDanmaku,
  nextOnlineCount,
  generateInitialOnlineCount,
  nextCouponIndex,
} from '../../live-stream/utils.js';
import { DANMAKU_TYPES, MIN_ONLINE_COUNT, MAX_ONLINE_COUNT, DANMAKU_MAX_HISTORY } from '../../live-stream/constants.js';

describe('live-stream utils', () => {
  describe('formatPrice', () => {
    it('应该正确格式化价格', () => {
      expect(formatPrice(99.9)).toBe('¥99.90');
      expect(formatPrice(0)).toBe('¥0.00');
    });
    it('应该处理 null/undefined/NaN', () => {
      expect(formatPrice(null)).toBe('¥0.00');
      expect(formatPrice(undefined)).toBe('¥0.00');
      expect(formatPrice(NaN)).toBe('¥0.00');
    });
    it('应该处理字符串数字', () => {
      expect(formatPrice('123.456')).toBe('¥123.46');
    });
  });

  describe('getDiscountPercent', () => {
    it('应该计算正确的折扣百分比', () => {
      expect(getDiscountPercent(100, 70)).toBe(30);
      expect(getDiscountPercent(200, 100)).toBe(50);
    });
    it('应该处理异常输入', () => {
      expect(getDiscountPercent(0, 100)).toBe(0);
      expect(getDiscountPercent(100, 0)).toBe(0);
      expect(getDiscountPercent(-100, 50)).toBe(0);
    });
    it('折扣百分比应在 0-100 之间', () => {
      expect(getDiscountPercent(100, 200)).toBe(0);
      expect(getDiscountPercent(100, -50)).toBe(0);
    });
  });

  describe('generateId', () => {
    it('应该生成字符串 id', () => {
      const id = generateId('test');
      expect(typeof id).toBe('string');
      expect(id.startsWith('test-')).toBe(true);
    });
    it('应该生成不同的 id', () => {
      const a = generateId('a');
      const b = generateId('a');
      expect(a).not.toBe(b);
    });
    it('默认前缀应为 id', () => {
      expect(generateId().startsWith('id-')).toBe(true);
    });
  });

  describe('轮播索引函数', () => {
    describe('getNextCarouselIndex', () => {
      it('应递增并循环', () => {
        expect(getNextCarouselIndex(0, 5)).toBe(1);
        expect(getNextCarouselIndex(4, 5)).toBe(0);
      });
      it('处理 totalCount=0 返回 0', () => {
        expect(getNextCarouselIndex(2, 0)).toBe(0);
      });
      it('处理字符串输入', () => {
        expect(getNextCarouselIndex('2', '5')).toBe(3);
      });
    });

    describe('getPrevCarouselIndex', () => {
      it('应递减并循环', () => {
        expect(getPrevCarouselIndex(0, 5)).toBe(4);
        expect(getPrevCarouselIndex(3, 5)).toBe(2);
      });
      it('处理 totalCount=0 返回 0', () => {
        expect(getPrevCarouselIndex(0, 0)).toBe(0);
      });
    });

    describe('getClampedCarouselIndex', () => {
      it('应限制在合法范围内', () => {
        expect(getClampedCarouselIndex(3, 5)).toBe(3);
        expect(getClampedCarouselIndex(-1, 5)).toBe(0);
        expect(getClampedCarouselIndex(10, 5)).toBe(4);
      });
      it('处理 count=0', () => {
        expect(getClampedCarouselIndex(2, 0)).toBe(0);
      });
    });
  });

  describe('规格函数', () => {
    describe('buildSpecKey', () => {
      it('应根据选中规格构建 key', () => {
        const key = buildSpecKey({ color: '黑色', size: '大号' });
        expect(key).toContain('黑色');
        expect(key).toContain('大号');
        expect(key).toContain('/');
      });
      it('空对象返回空字符串', () => {
        expect(buildSpecKey({})).toBe('');
        expect(buildSpecKey(null)).toBe('');
      });
    });

    describe('getInitialSpecs', () => {
      it('应为每个规格选择第一个选项', () => {
        const product = {
          specs: [
            { name: '颜色', options: ['黑', '白'] },
            { name: '尺寸', options: ['S', 'M', 'L'] },
          ],
        };
        const result = getInitialSpecs(product);
        expect(result).toEqual({ 颜色: '黑', 尺寸: 'S' });
      });
      it('无规格返回空对象', () => {
        expect(getInitialSpecs(null)).toEqual({});
        expect(getInitialSpecs({ specs: [] })).toEqual({});
      });
    });
  });

  describe('购物袋函数', () => {
    const product1 = {
      id: 'p1',
      name: '测试商品1',
      livePrice: 100,
      originalPrice: 200,
      image: 'img1',
      bgColor: '#fff',
      specs: [{ name: '颜色', options: ['红', '蓝'] }],
    };
    const product2 = {
      id: 'p2',
      name: '测试商品2',
      livePrice: 50,
      originalPrice: 80,
      image: 'img2',
      bgColor: '#000',
    };

    describe('addToBag', () => {
      it('空购物袋添加商品', () => {
        const bag = addToBag([], product2);
        expect(bag.length).toBe(1);
        expect(bag[0].quantity).toBe(1);
        expect(bag[0].name).toBe('测试商品2');
      });
      it('同规格商品累加数量', () => {
        let bag = addToBag([], product1, { 颜色: '红' }, 2);
        bag = addToBag(bag, product1, { 颜色: '红' }, 3);
        expect(bag.length).toBe(1);
        expect(bag[0].quantity).toBe(5);
      });
      it('不同规格作为不同商品', () => {
        let bag = addToBag([], product1, { 颜色: '红' });
        bag = addToBag(bag, product1, { 颜色: '蓝' });
        expect(bag.length).toBe(2);
      });
      it('数量至少为 1', () => {
        const bag = addToBag([], product2, {}, 0);
        expect(bag[0].quantity).toBe(1);
      });
      it('无效商品返回原购物袋', () => {
        expect(addToBag([], null)).toEqual([]);
        expect(addToBag([], {})).toEqual([]);
      });
      it('非数组输入返回空数组', () => {
        expect(addToBag(null, product2)).toEqual([]);
      });
    });

    describe('updateBagQuantity', () => {
      it('应更新指定商品数量', () => {
        const bag = addToBag([], product2);
        const updated = updateBagQuantity(bag, bag[0].cartItemId, 5);
        expect(updated[0].quantity).toBe(5);
      });
      it('数量<=0 时移除商品', () => {
        const bag = addToBag([], product2);
        expect(updateBagQuantity(bag, bag[0].cartItemId, 0)).toEqual([]);
        expect(updateBagQuantity(bag, bag[0].cartItemId, -1)).toEqual([]);
      });
      it('非数组输入返回空数组', () => {
        expect(updateBagQuantity('not array', 'x', 1)).toEqual([]);
      });
    });

    describe('removeFromBag', () => {
      it('应移除指定商品', () => {
        const bag = addToBag(addToBag([], product2), product1, { 颜色: '红' });
        const result = removeFromBag(bag, bag[0].cartItemId);
        expect(result.length).toBe(1);
      });
      it('无效 id 返回原购物袋', () => {
        const bag = addToBag([], product2);
        expect(removeFromBag(bag, 'not-exist')).toEqual(bag);
      });
    });

    describe('clearBag', () => {
      it('应返回空数组', () => {
        expect(clearBag()).toEqual([]);
      });
    });

    describe('calcBagSubtotal', () => {
      it('应正确计算小计', () => {
        let bag = addToBag([], product1, { 颜色: '红' }, 2);
        bag = addToBag(bag, product2, {}, 3);
        expect(calcBagSubtotal(bag)).toBe(100 * 2 + 50 * 3);
      });
      it('空购物袋返回 0', () => {
        expect(calcBagSubtotal([])).toBe(0);
      });
      it('非数组返回 0', () => {
        expect(calcBagSubtotal(null)).toBe(0);
      });
    });

    describe('calcBagCount', () => {
      it('应计算总件数', () => {
        let bag = addToBag([], product1, { 颜色: '红' }, 2);
        bag = addToBag(bag, product2, {}, 3);
        expect(calcBagCount(bag)).toBe(5);
      });
      it('空购物袋返回 0', () => {
        expect(calcBagCount([])).toBe(0);
      });
    });

    describe('getBestApplicableCoupon', () => {
      const coupons = [
        { id: 'c1', amount: 20, threshold: 100, name: '满100减20' },
        { id: 'c2', amount: 50, threshold: 300, name: '满300减50' },
        { id: 'c3', amount: 100, threshold: 500, name: '满500减100' },
      ];
      it('应选择满足条件的最大面额券', () => {
        expect(getBestApplicableCoupon(350, coupons)).toEqual(coupons[1]);
        expect(getBestApplicableCoupon(600, coupons)).toEqual(coupons[2]);
      });
      it('不满足任何条件返回 null', () => {
        expect(getBestApplicableCoupon(50, coupons)).toBe(null);
      });
      it('空优惠券数组返回 null', () => {
        expect(getBestApplicableCoupon(1000, [])).toBe(null);
        expect(getBestApplicableCoupon(1000, null)).toBe(null);
      });
    });

    describe('calcBagTotal', () => {
      const coupons = [
        { id: 'c1', amount: 50, threshold: 300, name: '满300减50' },
      ];
      it('应返回正确的结算信息', () => {
        const bag = addToBag([], product1, { 颜色: '红' }, 4);
        const result = calcBagTotal(bag, coupons);
        expect(result.subtotal).toBe(400);
        expect(result.discount).toBe(50);
        expect(result.total).toBe(350);
        expect(result.appliedCoupon).toEqual(coupons[0]);
      });
      it('小计为 0 时总金额为 0', () => {
        const result = calcBagTotal([], coupons);
        expect(result.subtotal).toBe(0);
        expect(result.discount).toBe(0);
        expect(result.total).toBe(0);
        expect(result.appliedCoupon).toBe(null);
      });
      it('折扣后金额不为负', () => {
        const bag = [{ price: 30, quantity: 1 }];
        const bigCoupon = [{ id: 'x', amount: 100, threshold: 10, name: '满10减100' }];
        const result = calcBagTotal(bag, bigCoupon);
        expect(result.total).toBe(0);
      });
    });
  });

  describe('倒计时函数', () => {
    describe('padZero', () => {
      it('个位数应补零', () => {
        expect(padZero(5)).toBe('05');
        expect(padZero(0)).toBe('00');
        expect(padZero(12)).toBe('12');
      });
      it('处理非数字输入', () => {
        expect(padZero(null)).toBe('00');
        expect(padZero('abc')).toBe('00');
      });
    });

    describe('formatCountdown', () => {
      it('应正确格式化毫秒', () => {
        const result = formatCountdown(5 * 60 * 1000 + 30 * 1000);
        expect(result.minutes).toBe('05');
        expect(result.seconds).toBe('30');
        expect(result.expired).toBe(false);
      });
      it('0 或负值标记为过期', () => {
        expect(formatCountdown(0).expired).toBe(true);
        expect(formatCountdown(-1000).expired).toBe(true);
      });
      it('返回总秒数和毫秒', () => {
        const r = formatCountdown(125 * 1000);
        expect(r.totalSeconds).toBe(125);
        expect(r.totalMs).toBe(125 * 1000);
      });
    });
  });

  describe('pickRandom', () => {
    it('从数组中随机取值', () => {
      const arr = [1, 2, 3];
      for (let i = 0; i < 20; i++) {
        expect(arr.includes(pickRandom(arr))).toBe(true);
      }
    });
    it('空数组返回 null', () => {
      expect(pickRandom([])).toBe(null);
      expect(pickRandom(null)).toBe(null);
    });
  });

  describe('弹幕函数', () => {
    describe('createDanmaku', () => {
      it('创建默认类型弹幕', () => {
        const d = createDanmaku({ content: 'hello' });
        expect(d.type).toBe(DANMAKU_TYPES.COMMENT);
        expect(d.content).toBe('hello');
        expect(d.id.startsWith('dmk-')).toBe(true);
      });
      it('创建购买类型弹幕', () => {
        const d = createDanmaku({ type: DANMAKU_TYPES.PURCHASE, content: 'buy' });
        expect(d.type).toBe(DANMAKU_TYPES.PURCHASE);
      });
      it('无效类型回退到 COMMENT', () => {
        const d = createDanmaku({ type: 'invalid', content: 'x' });
        expect(d.type).toBe(DANMAKU_TYPES.COMMENT);
      });
      it('包含 username 字段', () => {
        const d = createDanmaku({ content: 'a', username: '自定义用户' });
        expect(d.username).toBe('自定义用户');
      });
    });

    describe('pushDanmaku', () => {
      it('添加弹幕到历史', () => {
        const history = [];
        const d = createDanmaku({ content: 'a' });
        const next = pushDanmaku(history, d);
        expect(next.length).toBe(1);
        expect(next[0]).toBe(d);
      });
      it('超过最大数量时应截断最旧的', () => {
        const history = new Array(DANMAKU_MAX_HISTORY).fill(null).map((_, i) =>
          createDanmaku({ content: String(i) })
        );
        const newD = createDanmaku({ content: 'new' });
        const next = pushDanmaku(history, newD);
        expect(next.length).toBe(DANMAKU_MAX_HISTORY);
        expect(next[next.length - 1]).toBe(newD);
        expect(next[0].content).toBe('1');
      });
      it('空弹幕或空历史返回合理结果', () => {
        expect(pushDanmaku([], null)).toEqual([]);
        expect(pushDanmaku(null, createDanmaku({}))).toEqual([]);
      });
    });
  });

  describe('在线人数函数', () => {
    describe('generateInitialOnlineCount', () => {
      it('初始值应在合法范围内', () => {
        for (let i = 0; i < 50; i++) {
          const v = generateInitialOnlineCount();
          expect(v).toBeGreaterThanOrEqual(MIN_ONLINE_COUNT);
          expect(v).toBeLessThanOrEqual(MAX_ONLINE_COUNT);
          expect(Number.isInteger(v)).toBe(true);
        }
      });
    });

    describe('nextOnlineCount', () => {
      it('新值应在合法范围内', () => {
        for (let i = 0; i < 100; i++) {
          const v = nextOnlineCount(MIN_ONLINE_COUNT + 500);
          expect(v).toBeGreaterThanOrEqual(MIN_ONLINE_COUNT);
          expect(v).toBeLessThanOrEqual(MAX_ONLINE_COUNT);
        }
      });
      it('边界值不会越界', () => {
        for (let i = 0; i < 20; i++) {
          const vmin = nextOnlineCount(MIN_ONLINE_COUNT);
          const vmax = nextOnlineCount(MAX_ONLINE_COUNT);
          expect(vmin).toBeGreaterThanOrEqual(MIN_ONLINE_COUNT);
          expect(vmax).toBeLessThanOrEqual(MAX_ONLINE_COUNT);
        }
      });
      it('处理 0/null 输入', () => {
        const v = nextOnlineCount(null);
        expect(v).toBeGreaterThanOrEqual(MIN_ONLINE_COUNT);
      });
    });
  });

  describe('nextCouponIndex', () => {
    it('应递增并循环', () => {
      expect(nextCouponIndex(0, 3)).toBe(1);
      expect(nextCouponIndex(2, 3)).toBe(0);
    });
    it('处理空数组', () => {
      expect(nextCouponIndex(0, 0)).toBe(0);
    });
  });
});
