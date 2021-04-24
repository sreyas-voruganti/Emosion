class Class {
    state = {
        students: []
    }
    constructor(options) {
        this.state.id = options.id
        this.io = options.io

        this.stateInterval = setTimeout(() => {
            this.io.to(this.state.id).emit('state_refresh', this.state)
        }, 5000)
    }

    setState(statePatch) {
        for (const key in statePatch) {
            this.state[key] = statePatch[key]
        }
        this.io.to(this.state.id).emit('state_patch', statePatch)
    }

}

module.exports = Race