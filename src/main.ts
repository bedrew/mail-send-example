import fs from 'fs'
import { createEmailData, sleep } from './util'

const EMAIL_FILE = './email.json'
const EMAIL_FILE_ENTRIES = 200

enum EmailStatus {
    DONE = 'DONE',
    ERROR = 'ERROR',
}

interface MailInfo {
    email: string
    fio: string
    status?: EmailStatus
}

class EmailSender {

    public constructor(
        protected sendFn: (email: string, fio: string) => Promise<unknown>,
        protected config = { timeoutSec: 60, maxCallPerTimeout: 60 },
    ) {
        if (this.config.maxCallPerTimeout < 1) {
            throw new Error('maxCallPerTimeout must be greater than 0')
        }
    }

    public async run(mail: MailInfo[], beforeTimeout?: (mail: MailInfo[]) => Promise<void>) {
        const mailToSend = mail.filter(e => !e.status)
        for (let i = 0; i < mailToSend.length; i += this.config.maxCallPerTimeout) {
            const tsStart = Date.now()
            const oneMailArrayChunk = mailToSend.slice(i, i + this.config.maxCallPerTimeout)
            const promises = oneMailArrayChunk.map(e => this.sendFn(e.email, e.fio))
            await Promise.allSettled(promises).then(r =>
                r.forEach((i, idx) => {
                    if (i.status === 'fulfilled') {
                        oneMailArrayChunk[idx].status = EmailStatus.DONE
                    } else {
                        oneMailArrayChunk[idx].status = EmailStatus.ERROR
                    }
                }),
            )
            if (beforeTimeout) {
                await beforeTimeout(mail)
            }
            const mailsLeft = mail.filter(e => !e.status).length
            if (!mailsLeft) {
                break
            }
            const timePassed = (Date.now() - tsStart) / 1000
            if (timePassed < this.config.timeoutSec) {
                const timeout = this.config.timeoutSec - timePassed
                console.log(`ждем ${Math.round(timeout)} сек. / осталось ${mailsLeft} писем`)
                await sleep(timeout * 1000)
            }
        }
        return mail
    }

}

const sendEmail = (email: string, fio: string) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (Math.floor(Math.random() * 10) > 0) {
                console.log(`отправлено на ${email}, имя: ${fio ? fio : 'client'}`)
                resolve(Math.floor(Math.random() * 100000))
            } else {
                console.error(`не отправлено на ${email}, имя: ${fio ? fio : 'client'}`)
                reject(new Error('не отправлено'))
            }
        }, Math.floor(Math.random() * (2000 - 100) + 100))
    })
}

(async function start() {

    const writeResultToFile = (r: MailInfo[]) => fs.writeFileSync(EMAIL_FILE, JSON.stringify(r))

    const email = fs.existsSync(EMAIL_FILE)
        ? JSON.parse(fs.readFileSync(EMAIL_FILE).toString())
        : createEmailData(EMAIL_FILE_ENTRIES)

    const result = await new EmailSender(sendEmail, { timeoutSec: 60, maxCallPerTimeout: 60 })
        .run(email, async (mail) => writeResultToFile(mail))

    writeResultToFile(result)

})()


