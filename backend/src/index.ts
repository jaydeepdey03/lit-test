import express, { Request, Response } from 'express';
import { MyLitClass } from '../controller/litController';

const app = express();
const port = 6969;


app.get('/', (req: Request, res: Response) => {
    res.send('Hello, TypeScript Express!');
});


app.post('/executeLitAction', async (req: Request, res: Response) => {
    const lit = new MyLitClass("ethereum")
    await lit.connect()

    const pkp = await lit.mintPkp()
    console.log(pkp?.publicKey)

    if (pkp) {
        const sign = await lit.executeLitAction(pkp.publicKey)
        console.log(sign)
    }



    await lit.disconnect()


    res.status(200).json({
        message: "success",
        pkp: pkp,
    })
})

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});


