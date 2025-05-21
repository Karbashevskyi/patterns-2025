// Create Iterator for given dataset with Symbol.asyncIterator
// Use for..of to iterate it and pass data to Basket
// Basket is limited to certain amount
// After iteration ended Basket should return Thenable
// to notify us with final list of items, total and
// escalated errors

interface IPurchase {
    name: string;
    price: number;
}

interface IPurchaseIteratorItem {
    value: IPurchase | undefined;
    done: boolean;
}

const purchases: IPurchase[] = [
  { name: 'Laptop',  price: 1500 },
  { name: 'Mouse',  price: 25 },
  { name: 'Keyboard',  price: 100 },
  { name: 'HDMI cable',  price: 10 },
  { name: 'Bag', price: 50 },
  { name: 'Mouse pad', price: 5 },
];

class PurchaseIterator {

    private purchase: IPurchaseIteratorItem[] = [];
    private finishItems: IPurchaseIteratorItem[] = [
        {
            value: undefined,
            done: true,
        }
    ];

    public constructor(purchase: IPurchase[]) {
        this.purchase = purchase.map((value) => ({
            value,
            done: false,
        }));
    }

    public async *[Symbol.asyncIterator](): AsyncGenerator<IPurchaseIteratorItem, void, unknown> {
        for (const item of [...this.purchase, ...this.finishItems]) {
            yield item;
        }
    }

    public static create(purchase: IPurchase[]) {
        const instance = new PurchaseIterator(purchase);
        return instance;
    }
  
}

class Basket {
    private limit = 0;
    private callback: ((items: IPurchase[], total: number) => void) | null = null;
    private items: IPurchase[] = [];
    private total = 0;
    private errors: Error[] = [];

    public constructor({ limit }, callback) {
            this.limit = limit;
            this.callback = callback;
    }

    public add(item: IPurchaseIteratorItem) {
        const { value } = item;
        if (value) {
            if ((this.total + value.price) > this.limit) {
                this.errors.push(new Error(`Limit exceeded: ${this.limit}`));
                return;
            }
            this.total += value.price || 0;
            this.items.push(value);
        } else {
            // console.log({
            //     errors: this.errors,
            //     items: this.items,
            //     total: this.total,
            // })
            this.callback?.(this.items, this.total);
        }
        
    }

    public getErrors() {
        return this.errors;
    }
}

const runMain = async () => {
    const goods = PurchaseIterator.create(purchases);
    const basket = new Basket({ limit: 1050 }, (items, total) => {
        console.log(total);
    });
    for await (const item of goods) {
        basket.add(item);
    }
};

runMain();