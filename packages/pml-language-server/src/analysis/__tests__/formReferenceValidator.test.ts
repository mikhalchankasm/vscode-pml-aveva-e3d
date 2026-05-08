import { DiagnosticSeverity } from 'vscode-languageserver/node';
import { describe, expect, it } from 'vitest';
import { Parser } from '../../parser/parser';
import { FormReferenceValidator } from '../formReferenceValidator';

describe('FormReferenceValidator', () => {
	it('should report missing form callback methods and unknown gadget references', () => {
		const source = `
setup form !!ReferenceForm
	button .apply |Apply| call |!this.apply()|
	button .missingButton |Missing| call |!this.missingButtonCallback()|
	!this.callback = '!this.init()'
	!this.quitcall = '!this.missingQuit()'
exit

define method .init()
endmethod

define method .apply()
	!this.apply.active = true
	!this.unknownGadget.active = true
endmethod
		`.trim();

		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const diagnostics = new FormReferenceValidator().check(parseResult.ast, DiagnosticSeverity.Warning);

		expect(diagnostics).toHaveLength(3);
		expect(diagnostics.map(diagnostic => diagnostic.code)).toEqual([
			'missing-form-callback',
			'missing-form-callback',
			'unknown-form-member'
		]);
		expect(diagnostics.map(diagnostic => diagnostic.message)).toEqual([
			"Form callback 'this.quitcall' references missing method '.missingQuit()'",
			"Gadget '.missingButton' callback references missing method '.missingButtonCallback()'",
			"Unknown form member or gadget '!this.unknownGadget'"
		]);
	});

	it('should accept declared members, nested gadgets, and existing methods', () => {
		const source = `
setup form !!ReferenceForm
	member .grid is NetGridControl
	frame .outer
		container .pipeGrid nobox PMLNETCONTROL |PipeGrid|
	exit
	!this.callback = '!this.init()'
exit

define method .init()
	!this.grid.BindToDataSource(!data)
	!this.pipeGrid.active = true
	!this.init()
endmethod
		`.trim();

		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const diagnostics = new FormReferenceValidator().check(parseResult.ast);

		expect(diagnostics).toHaveLength(0);
	});
});
