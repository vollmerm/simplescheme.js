(define (inc-f x) 
  (lambda (y)
    (set! x (+ x y))
    x))

(define inc (inc-f 5))
(inc 1) ; 6
(inc 1) ; 7
