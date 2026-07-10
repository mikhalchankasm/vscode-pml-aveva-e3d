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
	do !i from 1 to 2
		skip if (!this.missingSkip.active)
	enddo
endmethod
		`.trim();

		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const diagnostics = new FormReferenceValidator().check(parseResult.ast, DiagnosticSeverity.Warning);

		expect(diagnostics).toHaveLength(4);
		const sortedDiagnostics = [...diagnostics].sort((left, right) => left.message.localeCompare(right.message));
		expect(sortedDiagnostics.map(diagnostic => diagnostic.code)).toEqual([
			'missing-form-callback',
			'missing-form-callback',
			'unknown-form-member',
			'unknown-form-member'
		]);
		expect(sortedDiagnostics.map(diagnostic => diagnostic.message)).toEqual([
			"Form callback 'this.quitcall' references missing method '.missingQuit()'",
			"Gadget '.missingButton' callback references missing method '.missingButtonCallback()'",
			"Unknown form member or gadget '!this.missingSkip'",
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

	it('should not report dynamic members or external form callbacks as missing local references', () => {
		const source = `
setup form !!ReferenceForm
	button .openOther |Open| call |!!OtherForm.show()|
exit

define method .apply()
	!this.$!<activeGadget>.active = true
endmethod
		`.trim();

		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const diagnostics = new FormReferenceValidator().check(parseResult.ast);

		expect(diagnostics).toHaveLength(0);
	});

	it('should report an unknown form member before an indexed access', () => {
		const source = `
setup form !!ReferenceForm
exit

define method .apply()
	!this.missingItems[1].active = true
endmethod
		`.trim();

		const parseResult = new Parser().parse(source);
		expect(parseResult.errors).toHaveLength(0);

		const diagnostics = new FormReferenceValidator().check(parseResult.ast);

		expect(diagnostics).toHaveLength(1);
		expect(diagnostics[0]).toMatchObject({
			code: 'unknown-form-member',
			message: "Unknown form member or gadget '!this.missingItems'"
		});
	});
});
