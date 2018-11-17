console.log(process.env.barbi)
console.log(typeof(process.env.barbi))

var envs = {
    stage : {},
    prod : {}
}

var env = envs[process.env.barbi] || envs.stage