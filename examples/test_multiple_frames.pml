-- ============================================
-- Тестирование множественных frame блоков
-- ============================================

setup form !!testForm dialog resize
    !this.FormTitle = |Test Form|

    frame.frFirst |First Frame| at x0 y0 wid 100 HEI 30
        text.txt1 |Text 1| at x0 y0 wid 50 HEI 10
        button.btn1 |Button 1| at x50 y0 wid 50 HEI 10 call |.action1|

    exit
exit

-- Тест с layout form
layout form !!anotherForm dialog
    frame.frA |Frame A| at x0 y0 wid 100 HEI 25
        text.txtA |Text A| at x0 y0 wid 100 HEI 10

    exit

    frame.frB |Frame B| at x0 y25 wid 100 HEI 25
        text.txtB |Text B| at x0 y0 wid 100 HEI 10

    exit

    frame.frC |Frame C| at x0 y50 wid 100 HEI 25
        text.txtC |Text C| at x0 y0 wid 100 HEI 10

    exit
exit

-- Тест с вложенными frame
setup form !!nestedForm dialog
    frame.frOuter |Outer Frame| at x0 y0 wid 100 HEI 60
        text.txtOuter |Outer Text| at x0 y0 wid 100 HEI 10

        frame.frInner1 |Inner Frame 1| at x0 y10 wid 100 HEI 20
            text.txtInner1 |Inner Text 1| at x0 y0 wid 100 HEI 10

        exit

        frame.frInner2 |Inner Frame 2| at x0 y30 wid 100 HEI 20
            text.txtInner2 |Inner Text 2| at x0 y0 wid 100 HEI 10

        exit
    exit
exit


