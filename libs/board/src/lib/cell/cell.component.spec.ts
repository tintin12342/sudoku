import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CellComponent } from './cell.component';

const keyEvent = (key: string): KeyboardEvent =>
  new KeyboardEvent('keydown', { key });

describe('CellComponent', () => {
  let fixture: ComponentFixture<CellComponent>;
  let component: CellComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CellComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => jest.clearAllMocks());

  // onKeyDown — prefilled guard

  describe('onKeyDown — prefilled guard', () => {
    it('should not emit valueChange when cell is prefilled', () => {
      fixture.componentRef.setInput('isPrefilled', true);
      const spy = jest.spyOn(component.valueChange, 'emit');
      component.onKeyDown(keyEvent('5'));
      expect(spy).not.toHaveBeenCalled();
    });

    it('should emit valueChange when cell is not prefilled', () => {
      fixture.componentRef.setInput('isPrefilled', false);
      const spy = jest.spyOn(component.valueChange, 'emit');
      component.onKeyDown(keyEvent('5'));
      expect(spy).toHaveBeenCalledWith(5);
    });
  });

  // onKeyDown — number keys

  describe('onKeyDown — number keys 1–9', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isPrefilled', false);
    });

    it.each([1, 2, 3, 4, 5, 6, 7, 8, 9])(
      'should emit %i when its key is pressed',
      (num) => {
        const spy = jest.spyOn(component.valueChange, 'emit');
        component.onKeyDown(keyEvent(String(num)));
        expect(spy).toHaveBeenCalledWith(num);
      }
    );

    it('should not emit for out-of-range key "a"', () => {
      const spy = jest.spyOn(component.valueChange, 'emit');
      component.onKeyDown(keyEvent('a'));
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // onKeyDown — clear keys

  describe('onKeyDown — clear keys', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isPrefilled', false);
    });

    it.each(['Backspace', 'Delete', '0'])(
      'should emit 0 when key "%s" is pressed',
      (key) => {
        const spy = jest.spyOn(component.valueChange, 'emit');
        component.onKeyDown(keyEvent(key));
        expect(spy).toHaveBeenCalledWith(0);
      }
    );
  });

  // cellClick output

  describe('cellClick', () => {
    it('should emit cellClick when the cell is clicked', () => {
      const spy = jest.spyOn(component.cellClick, 'emit');
      fixture.debugElement.children[0].triggerEventHandler('click', null);
      expect(spy).toHaveBeenCalled();
    });
  });
});
