//Dependencies

//Local dependencies

//Instantiated

const Plugin = class Plugin {
	constructor(executablePath, tasksConfig, argumentConfig) {
		this._executablePath = executablePath;
		this._tasksConfig = tasksConfig;
		this._argumentConfig = argumentConfig;
	}

	////////////////////////
	// GETTERS AND SETTERS//
	////////////////////////

	get ExecutablePath() {
		return this._executablePath;
	}

	////////////////////
	// PUBLIC METHODS //
	////////////////////

	validateRequest(executionRequest) {
		// preserve context
		const _this = this;

		const issues = [];

		if (executionRequest.task != null) {
			const task = _this.tasksConfig[executionRequest.task];

			if (task == null) {
				issues.push(`Requested task "${executionRequest.task}" is not supported by plugin ${_this.constructor.name}`);
			} else if (task.command == null) {
				issues.push(`Plugin ${_this.constructor.name} is not properly configured to run requested task ${executionRequest.task}`);
			}
		}

		if (executionRequest.arguments != null) {
			if (!Array.isArray(executionRequest.arguments)) {
				issues.push(`Work request arguments must be an array`);
			} else {
				executionRequest.arguments.forEach((argument) => {
					const argKey = argument[0];
					const argValue = argument[1];
					const argRules = _this._argumentConfig[argKey];

					if (argRules == null) {
						issues.push(`No argument rules defined for argument "${argKey}" in plugin ${_this.constructor.name}`);
					} else if (!argRules.allowedValues.includes(argValue)) {
						issues.push(`Invalid value assigned to argument "${argKey}"; must be one of ${argRules.allowedValues.join(`, `)}`);
					}
				});
			}
		}
		
		if (issues.length > 0) {
			return {
				success: false,
				error: issues.join(`\n`),
				issues,
			};
		}

		return {
			success: true,
			error: null,
			issues,
		};
	}

	parseCommand(executionRequest) {
		// preserve context
		const _this = this;
		
		const validation = _this.validateRequest(executionRequest);
		if (validation.success !== true) {
			throw new Error(`Invalid request received:\n${validation.error}`);
		}

		let commandArray = [_this._executablePath];

		if (executionRequest.task != null) {
			commandArray = [...commandArray, _this._tasksConfig[executionRequest.task].command];
		}

		if (executionRequest.arguments != null) {
			executionRequest.arguments.forEach((argument) => { commandArray = [...commandArray, ...argument]; });
		}

		return commandArray.join(` `);
	}

	////////////////////
	// PRIVATE METHODS//
	////////////////////

};

export { Plugin };
export default Plugin;
