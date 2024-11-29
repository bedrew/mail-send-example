export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

const randomArrElement = <T>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

const randomNumber = (min:number, max:number) => Math.floor(Math.random() * (max - min + 1)) + min

export const createEmailData = (
    size = 10000,
    nameTemplates = [
        'Иван', 'Ли', 'Петя', 'Вася',
        'Андрей', 'Иванов', 'Петров',
        'Сидоров', 'Смирнов', '',
    ]) => {
    const data: {fio: string, email: string}[] = []
    for (let i = 0; i < size; i++) {
        const fio = [
            randomArrElement(nameTemplates),
            randomArrElement(nameTemplates),
            randomArrElement(nameTemplates),
        ].filter(Boolean).join(' ')
        data.push({ email: `example${randomNumber(0, i)}@email.com`, fio })
    }
    return data
}