(define (disp F T)
  (display "move ring from ")
  (display F)
  (display " to ")
  (display T)
  (newline))

(define (hanoi rings F T U)
  (if (= 0 rings) "done"
                  (begin (hanoi (- rings 1) F U T)
                         (disp F T)
                         (hanoi (- rings 1) U T F))))

(hanoi 3 "a" "b" "c")